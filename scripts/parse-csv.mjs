import { readFileSync } from 'fs';

const csvContent = readFileSync('c:/Users/sabba/Downloads/sulban new - Sheet1.csv', 'utf-8');

// Simple CSV parser that handles quoted fields with newlines
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            if (insideQuotes && text[i + 1] === '"') {
                currentField += '"';
                i++; // Skip next quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && text[i + 1] === '\n') {
                i++; // Skip \n after \r
            }
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
        } else {
            currentField += char;
        }
    }

    // Don't forget last row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    return rows;
}

const rows = parseCSV(csvContent);
const headers = rows[0];
const data = rows.slice(1);

// Find column indices
const categoryIdx = headers.indexOf('category');
const subCategoryIdx = headers.indexOf('sub_category');
const skuIdx = headers.indexOf('SKU');

console.log('Headers:', headers);
console.log('Category column index:', categoryIdx);
console.log('Sub-category column index:', subCategoryIdx);
console.log('Total rows:', data.length);
console.log('');

// Get unique categories and sub-categories
const categories = new Set();
const subCategories = new Set();
const categorySubMap = new Map();

for (const row of data) {
    const category = row[categoryIdx]?.trim();
    const subCategory = row[subCategoryIdx]?.trim();

    if (category && category.length < 50) {
        categories.add(category);

        if (!categorySubMap.has(category)) {
            categorySubMap.set(category, new Set());
        }
        if (subCategory && subCategory.length < 50) {
            categorySubMap.get(category).add(subCategory);
            subCategories.add(subCategory);
        }
    }
}

console.log('Unique Categories:');
for (const cat of categories) {
    console.log(`  - ${cat}`);
}

console.log('\nCategory -> Sub-categories mapping:');
for (const [cat, subs] of categorySubMap) {
    console.log(`  ${cat}:`);
    for (const sub of subs) {
        console.log(`    - ${sub}`);
    }
}
