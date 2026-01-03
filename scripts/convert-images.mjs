import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

const SOURCE_DIR = 'c:/Users/sabba/Downloads/Sluban New Items-20260103T100638Z-1-001/Sluban New Items';
const OUTPUT_DIR = 'c:/Users/sabba/Desktop/projects/hardrock-ecom-demo/public/images/products/sluban';

async function convertImages() {
    // Create output directory if it doesn't exist
    if (!existsSync(OUTPUT_DIR)) {
        await mkdir(OUTPUT_DIR, { recursive: true });
    }

    // Read all files from source directory
    const files = await readdir(SOURCE_DIR);

    let converted = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
        const ext = extname(file).toLowerCase();
        const nameWithoutExt = basename(file, ext);

        // Clean up filenames (some have issues like "M38-B1101-04-1,jpg.jpg")
        const cleanName = nameWithoutExt.replace(/,jpg$/, '').replace(/\.jpg$/, '');
        const outputPath = join(OUTPUT_DIR, `${cleanName}.webp`);

        // Skip if not an image
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            console.log(`Skipping non-image: ${file}`);
            skipped++;
            continue;
        }

        // If already webp, just copy with consistent naming
        if (ext === '.webp') {
            try {
                await sharp(join(SOURCE_DIR, file))
                    .webp({ quality: 85 })
                    .toFile(outputPath);
                converted++;
                console.log(`Copied: ${file} -> ${cleanName}.webp`);
            } catch (err) {
                console.error(`Error copying ${file}:`, err.message);
                errors++;
            }
            continue;
        }

        // Convert JPG/PNG to WebP
        try {
            await sharp(join(SOURCE_DIR, file))
                .webp({ quality: 85 })
                .toFile(outputPath);
            converted++;
            console.log(`Converted: ${file} -> ${cleanName}.webp`);
        } catch (err) {
            console.error(`Error converting ${file}:`, err.message);
            errors++;
        }
    }

    console.log('\n--- Summary ---');
    console.log(`Converted: ${converted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total files: ${files.length}`);
}

convertImages().catch(console.error);
