# CLAUDE.md - Project Context

> Project-specific context and conventions for AI assistants to maintain continuity across sessions.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Localization (i18n)](#localization-i18n)
3. [Key Utilities & Hooks](#key-utilities--hooks)
4. [Responsive Design](#responsive-design)
5. [File Reference](#file-reference)
6. [Database & Seeding](#database--seeding)
7. [Image Handling](#image-handling)
8. [Data Models](#data-models)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## Project Overview

| Stack Component | Technology |
|-----------------|------------|
| Backend | Laravel 12 |
| SPA Bridge | Inertia.js |
| Frontend | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| i18n | i18next |

**Demo Accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hardrock-co.com | demo1234 |
| Customer | customer@hardrock-co.com | demo1234 |

---

## Localization (i18n)

### Languages
- **English** (`en`) - Default
- **Arabic** (`ar`) - RTL language

### Translation Files
```
resources/js/locales/
├── en/
│   ├── common.json
│   ├── shop.json
│   └── nav.json
└── ar/
    ├── common.json
    ├── shop.json
    └── nav.json
```

### Usage Patterns

**Namespaced translations:**
```typescript
const { t } = useTranslation();

t('common:outOfStock')        // From common.json
t('shop:filters')             // From shop.json
t('shop:sortOptions.newest')  // Nested keys
```

**Interpolation:**
```typescript
t('shop:showingResults', { from: 1, to: 10, total: 100 })
```

### Arabic Numerals

**Formatting (number → Arabic):**
```typescript
import { formatNumber } from '@/lib/utils';

formatNumber(25, 'ar')   // "٢٥"
formatNumber(100, 'en')  // "100"
```

**Parsing (Arabic → number):**
```typescript
function parseArabicNumber(str: string): number {
    const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
    let result = '';
    for (const char of str) {
        const index = arabicNumerals.indexOf(char);
        if (index !== -1) result += index.toString();
        else if (/[0-9]/.test(char)) result += char;
    }
    return parseInt(result) || 0;
}
```

### RTL Tips
- Phone numbers: use `dir="ltr"` to prevent digit reversal
- Arabic translations with static numbers: use Arabic numerals in JSON (`"٢٥ دينار"`)
- Check language: `i18n.language === 'ar'`

---

## Key Utilities & Hooks

### Utility Functions (`resources/js/lib/utils.ts`)

| Function | Purpose |
|----------|---------|
| `formatPrice(price, language)` | Format currency (JOD/دينار) |
| `formatNumber(value, language)` | Arabic numeral formatting |
| `getImageUrl(path, productId, sortOrder)` | Resolve image URLs |
| `getDiscountPercentage(price, comparePrice)` | Calculate discount % |

### Localized Content Hook (`@/hooks/useLocalized`)

```typescript
const { getProductName, getCategoryName } = useLocalized();

getProductName(product)    // Returns name_ar if Arabic, else name
getCategoryName(category)  // Returns name_ar if Arabic, else name
```

---

## Responsive Design

### Breakpoints
| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile base |
| `sm:` | 640px | Large phones |
| `md:` | 768px | **Primary mobile/desktop split** |
| `lg:` | 1024px | Desktop |

### Common Patterns
```tsx
// Mobile only / Desktop only
<div className="md:hidden">Mobile</div>
<div className="hidden md:block">Desktop</div>

// Responsive grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">

// Responsive spacing
<div className="p-2 sm:p-4 md:p-6">
```

---

## File Reference

### Layouts
| File | Description |
|------|-------------|
| `Layouts/ShopLayout.tsx` | Main shop layout (header, footer, nav) |

### Pages
| File | Description |
|------|-------------|
| `Pages/Shop/Home.tsx` | Homepage with featured categories |
| `Pages/Shop/Category.tsx` | Category page with filters & grid |
| `Pages/Shop/Product.tsx` | Product detail page |
| `Pages/Shop/Search.tsx` | Search results |
| `Pages/Shop/Cart.tsx` | Shopping cart |
| `Pages/Shop/Checkout.tsx` | Checkout flow |

### Key Components
| File | Description |
|------|-------------|
| `Components/shop/ProductCard.tsx` | Product card in grids |
| `Components/shop/ProductGrid.tsx` | Product grid layout |
| `Components/shop/HeroBanner.tsx` | Homepage hero |
| `Components/ui/DualRangeSlider.tsx` | Price range filter |
| `Components/ui/Badge.tsx` | Status badges |

### Contexts
| File | Description |
|------|-------------|
| `contexts/WishlistContext.tsx` | Wishlist state |
| `contexts/CartContext.tsx` | Cart state |

---

## Database & Seeding

### Seeding Order
Run: `php artisan db:seed`

| # | Seeder | Description |
|---|--------|-------------|
| 1 | UserSeeder | Demo accounts |
| 2 | CategorySeeder | Categories & subcategories |
| 3 | ProductSeeder | Electronics & Skincare |
| 4 | AdditionalProductsSeeder | Fashion, Home, Sports, etc. |
| 5 | NewCategoriesSeeder | Additional products |
| 6 | **SlubanProductSeeder** | Imports from CSV |
| 7 | BuildingBlocksSubcategoriesSeeder | Organize Sluban products |
| 8 | ProductSubcategoriesSeeder | Redistribute to subcategories |
| 9 | SaleProductsSeeder | Add discounts |
| 10 | OrderSeeder | Demo orders |

### CSV Import (Sluban Products)

**Source file:**
```
c:/Users/sabba/Desktop/Project files/hardrock_e-commerce/sulban new - Sheet1.csv
```

**CSV Columns:**
| Column | Description |
|--------|-------------|
| SKU | Product identifier |
| name_en / name_ar | Bilingual names |
| description_en / description_ar | Bilingual descriptions |
| price | Product price |
| stock | Inventory count |
| thumbnail_name | Primary image filename |
| image_names | Additional images (comma-separated) |

**Image source folder:**
```
c:/Users/sabba/Desktop/Project files/hardrock_e-commerce/new_images/Sluban New Items.../
```

---

## Image Handling

### URL Resolution Logic (`getImageUrl`)

```typescript
function getImageUrl(path, productId, sortOrder) {
    if (!path) → picsum.photos placeholder
    if (path.startsWith('http')) → return as-is
    if (path.startsWith('products/')) → /images/${path}
    else → /storage/${path}
}
```

### Storage Locations

| Type | Location | Served As |
|------|----------|-----------|
| Seeded products | `public/images/products/` | `/images/products/...` |
| Sluban products | `public/images/products/sluban/` | `/images/products/sluban/...` |
| Uploaded (admin) | `storage/app/public/` | `/storage/...` |
| Category banners | `public/images/categories/` | `/images/categories/...` |

### External Assets
```
c:/Users/sabba/Desktop/Project files/hardrock_e-commerce/
├── E-COMMERCE WEBSITE -ELECTRONIC BANNER DESKTOP.jpg
├── E-COMMERCE WEBSITE -ELECTRONIC BANNER MOBILE.jpg
└── (WebP versions)
```

---

## Data Models

### Category
| Field | Type | Description |
|-------|------|-------------|
| name / name_ar | string | Bilingual names |
| description / description_ar | string | Bilingual descriptions |
| slug | string | URL identifier |
| parent_id | int/null | Parent category (null = top-level) |
| image | string | Category thumbnail |
| is_active | boolean | Visibility |
| sort_order | int | Display order |

**Parent categories:** Electronics, Skincare, Building Blocks, Fashion, Home & Kitchen, Sports, Stationery, Kids

### Product
| Field | Type | Description |
|-------|------|-------------|
| name / name_ar | string | Bilingual names |
| description / description_ar | text | Full descriptions |
| short_description / short_description_ar | string | Brief descriptions |
| price | decimal | Current price |
| compare_price | decimal/null | Original price (for sales) |
| sku | string | Stock keeping unit |
| stock | int | Inventory count |
| is_active | boolean | Visibility |
| is_featured | boolean | Featured flag |
| times_purchased | int | Purchase count |
| average_rating | decimal | 0-5 rating |
| rating_count | int | Number of reviews |
| view_count | int | Page views |
| category_id | int | Belongs to category |

---

## Common Issues & Solutions

### TypeScript Translation Interpolation
```typescript
// Error: string not assignable to number
t('shop:showingResults', { total: formatNumber(count, language) })

// Fix with cast
formatNumber(count, language) as unknown as number
```

### Mobile Horizontal Overflow
```tsx
// Problem: extends beyond viewport
className="absolute left-0 right-0"

// Solution: add padding
className="absolute left-4 right-4"
```

### Container Overflow
Add `overflow-hidden` to parent containers when children extend beyond bounds.

### Footer Grid Layout
- Mobile: 2x2 grid (`grid-cols-2`)
- Desktop: 4 columns (`md:grid-cols-4`)
- Shop categories: 2-column subgrid on desktop (`md:grid md:grid-cols-2`)
