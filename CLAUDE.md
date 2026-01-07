# CLAUDE.md - Project Context

> Project-specific context and conventions for AI assistants to maintain continuity across sessions.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Localization (i18n)](#localization-i18n)
3. [Key Utilities & Hooks](#key-utilities--hooks)
4. [Cart & Wishlist System](#cart--wishlist-system)
5. [Product Variant System](#product-variant-system)
6. [Category Page & Filters](#category-page--filters)
7. [RTL Navigation Patterns](#rtl-navigation-patterns)
8. [UI Effects & Animations](#ui-effects--animations)
9. [SPA Navigation](#spa-navigation)
10. [Responsive Design](#responsive-design)
11. [File Reference](#file-reference)
12. [Database & Seeding](#database--seeding)
13. [Image Handling](#image-handling)
14. [Data Models](#data-models)
15. [Common Issues & Solutions](#common-issues--solutions)

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

## Cart & Wishlist System

### CartContext (`contexts/CartContext.tsx`)

**Key exports:**
```typescript
interface CartContextType {
    cart: CartData;
    addToCart: (productId: number, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    loading: boolean;
    isInCart: (productId: number) => boolean;  // Check if product is in cart
}
```

**Usage:**
```typescript
const { cart, addToCart, isInCart } = useCart();

// Check if product is already in cart
if (isInCart(product.id)) {
    // Show "In Cart" indicator
}
```

### WishlistContext (`contexts/WishlistContext.tsx`)

**Behavior:** Items stay in wishlist after adding to cart. Shows "In Cart" badge with brand-orange color.

### Drawer Localization Pattern

Both CartDrawer and WishlistDrawer follow the same localization pattern:

```typescript
const { t, i18n } = useTranslation();
const language = i18n.language;
const { getProductName } = useLocalized();

// Title with Arabic numerals
{t('common:cart.title')} {t('common:cart.itemCount', {
    count: formatNumber(cart.total_items, language) as unknown as number
})}

// Localized product name
const productName = getProductName(item.product);
// Or manually:
const productName = language === 'ar' && item.product.name_ar
    ? item.product.name_ar
    : item.product.name;
```

### Translation Keys (common.json)

**Wishlist namespace:**
```json
"wishlist": {
    "title": "Wishlist" / "قائمة الرغبات",
    "itemCount": "({{count}})",
    "empty": "Your wishlist is empty" / "قائمة رغباتك فارغة",
    "startShopping": "Start Shopping" / "ابدأ التسوق",
    "clearWishlist": "Clear Wishlist" / "مسح القائمة",
    "inCart": "In Cart" / "في السلة",
    "removeFromWishlist": "Remove from wishlist" / "إزالة من القائمة"
}
```

**Cart namespace:**
```json
"cart": {
    "title": "Cart" / "السلة",
    "itemCount": "({{count}})",
    "empty": "Your cart is empty" / "سلتك فارغة",
    "continueShopping": "Continue Shopping" / "متابعة التسوق",
    "subtotal": "Subtotal" / "المجموع الفرعي",
    "shippingNote": "Shipping and taxes calculated at checkout." / "يتم احتساب الشحن والضرائب عند الدفع.",
    "checkout": "Checkout" / "إتمام الشراء",
    "viewCart": "View Cart" / "عرض السلة",
    "removeFromCart": "Remove from cart" / "إزالة من السلة"
}
```

### Backend Cart Data (`CartService.php`)

The `getCartData()` method returns bilingual product names:
```php
'product' => [
    'id' => $item->product->id,
    'name' => $item->product->name,
    'name_ar' => $item->product->name_ar,  // For Arabic support
    'slug' => $item->product->slug,
    'price' => $item->product->price,
    'stock' => $item->product->stock,
    'image' => $item->product->getPrimaryImageUrl(),
],
```

---

## Product Variant System

### Overview

Products can have **color images** (multiple images representing different colors) and **size options** (with individual stock per size).

**Approach:** Single product with multiple images for color variants. Users click thumbnail images to switch colors. Size selector shows stock per size.

### Database Fields (products table)

| Field | Type | Description |
|-------|------|-------------|
| `color` | string | Default color name (e.g., "black") |
| `color_hex` | string | Hex code for display (e.g., "#000000") |
| `available_sizes` | JSON array | Available sizes (e.g., `["S", "M", "L", "XL"]`) |
| `size_stock` | JSON object | Stock per size (e.g., `{"S": 15, "M": 25, "L": 30}`) |
| `product_group` | string | For future use - grouping related products |

### Product Model Methods

```php
// Check if product has sizes
$product->hasSizes();  // true if available_sizes is set

// Get stock for specific size
$product->getStockForSize('M');  // Returns int

// Get total stock across all sizes
$product->getTotalSizeStock();  // Returns int

// Check if size is in stock
$product->isSizeInStock('XL');  // Returns bool
```

### TypeScript Types

```typescript
interface SizeStock {
    [size: string]: number;
}

interface Product {
    // ... existing fields
    color?: string | null;
    color_hex?: string | null;
    available_sizes?: string[] | null;
    size_stock?: SizeStock | null;
    product_group?: string | null;
}
```

### Product Page Features

**Color Selection:**
- Multiple product images (one per color) shown as thumbnails
- Clicking a thumbnail switches the main image
- Existing image gallery functionality handles this automatically

**Size Selection:**
- Size buttons displayed when `available_sizes` is set
- Shows stock count per size when selected
- Out-of-stock sizes are disabled with strikethrough
- "Please select a size" warning shown until size is selected
- Add to Cart disabled until size is selected

### Example: Fashion Products

The Zip Up Hoodie demonstrates the variant system:
- Single product with 4 color images (Black, White, Red, Grey)
- 7 sizes: S, M, L, XL, XXL, 3XL, 4XL
- Different stock levels per size
- Images stored in `public/images/products/fashion/`

### Seeder

Run: `php artisan db:seed --class=FashionVariantSeeder`

### Translation Keys (shop.json)

```json
"selectSize": "Select Size" / "اختر المقاس"
"pleaseSelectSize": "Please select a size" / "يرجى اختيار المقاس"
"inStockCount": "{{count}} in stock" / "{{count}} متوفر"
"size": "Size" / "المقاس"
"color": "Color" / "اللون"
```

### Future Enhancements (TODO)

> **Note:** The cart system currently does NOT track selected size. When adding variant products to cart, size selection should be implemented:
> - Update `CartItem` to store selected size
> - Validate size stock before adding
> - Decrement size-specific stock on purchase
> - Update cart UI to show/select size

---

## RTL Navigation Patterns

### Scroll Arrow Behavior

For horizontal scrollable rows (subcategories, filters), arrows should:
- **Icons stay consistent:** Left arrow on left, right arrow on right
- **Scroll direction swaps for Arabic:** Left button scrolls right, right button scrolls left

```tsx
const { i18n } = useTranslation();
const language = i18n.language;

// Subcategories scroll buttons
<button onClick={() => scroll(language === 'ar' ? 'right' : 'left')}>
    <ChevronLeft className="h-5 w-5" />
</button>
<button onClick={() => scroll(language === 'ar' ? 'left' : 'right')}>
    <ChevronRight className="h-5 w-5" />
</button>
```

### Implementation in Category Page

File: `Pages/Shop/Category.tsx`

Both subcategories row and quick filters row use this pattern for RTL-aware scrolling.

---

## Category Page & Filters

### Filter System

The category page uses a simplified filter approach with toggle checkboxes for variant options.

**Filter Types:**
| Filter | Type | Description |
|--------|------|-------------|
| New Arrivals | Checkbox | Products added in last 30 days |
| Price | Dual Range Slider | Min/max price range |
| Availability | Checkbox | In stock only |
| Has Color Options | Checkbox | Products with color variants |
| Has Size Options | Checkbox | Products with size variants |
| Discount | Checkbox | Products on sale |

**Filter Order (Desktop & Mobile):**
1. New Arrivals
2. Price
3. Availability
4. Color Options (conditional - only shows if products have colors)
5. Size Options (conditional - only shows if products have sizes)
6. Discount

### Backend Filtering (`LandingController.php`)

```php
// Color/Size filter - checks for products with variants
if ($request->boolean('has_colors')) {
    $query->whereNotNull('color')->where('color', '!=', '');
}

if ($request->boolean('has_sizes')) {
    $query->whereNotNull('available_sizes');
}

// Returns counts for conditional filter display
$productsWithColors = Product::whereNotNull('color')->where('color', '!=', '')->count();
$productsWithSizes = Product::whereNotNull('available_sizes')->count();
```

### Mobile Filter Panel

The mobile filter uses a two-panel approach:
- **Left panel**: Filter categories (New Arrivals, Price, etc.)
- **Right panel**: Filter options for selected category

Dynamic categories based on available products:
```typescript
const filterCategories = [
    { id: 'new_arrivals', label: t('shop:filterCategories.newArrivals'), icon: Clock },
    { id: 'price', label: t('shop:filterCategories.price'), icon: Wallet },
    { id: 'availability', label: t('shop:filterCategories.availability'), icon: Package },
    ...(productsWithColors > 0 ? [{ id: 'color', label: t('shop:filterCategories.color'), icon: Palette }] : []),
    ...(productsWithSizes > 0 ? [{ id: 'size', label: t('shop:filterCategories.size'), icon: Ruler }] : []),
    { id: 'discount', label: t('shop:filterCategories.discount'), icon: Tag },
];
```

### Category Banner Images

Location: `public/images/banners/categories/`

Naming convention: `{category-slug}-{language}.webp`
- Example: `electronics-en.webp`, `electronics-ar.webp`

All 8 categories have both English and Arabic banner versions.

---

## UI Effects & Animations

### Homepage Category Icons (Glassmorphism)

File: `Components/shop/CategoryNav.tsx`

Category icons use glassmorphism effect with brand colors:

```typescript
const brandStyle = {
    bg: 'from-brand-purple/10 to-brand-purple-400/20',
    icon: 'text-brand-orange group-hover:text-brand-orange-600',
    glow: 'group-hover:shadow-brand-purple/30'
};
```

**Effects:**
- Semi-transparent card (`bg-white/40 backdrop-blur-md`)
- Gradient icon background (brand purple)
- Orange icon color
- Hover: scale up, lift, colored shadow glow
- Bottom accent line (purple to orange gradient) expands on hover

### Logo Pulse Animation

File: `Layouts/ShopLayout.tsx`

The HardRock logo pulses periodically:
- Initial pulse after 3 seconds
- Recurring pulse every 15 seconds
- Scale animation (100% → 110%)
- 700ms smooth transition

```typescript
const [logoPulse, setLogoPulse] = useState(false);

useEffect(() => {
    const triggerLogoPulse = () => {
        setLogoPulse(true);
        setTimeout(() => setLogoPulse(false), 1500);
    };
    const initialTimeout = setTimeout(triggerLogoPulse, 3000);
    const interval = setInterval(triggerLogoPulse, 15000);
    return () => { clearTimeout(initialTimeout); clearInterval(interval); };
}, []);
```

### Wishlist Pulse Animation

When wishlist has items, the heart icon pulses:
- Every 10 seconds
- Scale animation (100% → 125%)
- Orange color when items present

---

## SPA Navigation

### Category Navigation (Partial Page Updates)

File: `Layouts/ShopLayout.tsx`

The secondary category navbar uses SPA navigation when already on a category page:

```typescript
const handleClick = (e: React.MouseEvent) => {
    if (isOnCategoryPage) {
        e.preventDefault();
        router.get(categoryUrl, {}, {
            preserveState: false,
            preserveScroll: false,
            only: ['category', 'subcategories', 'products', 'filters', 'productsWithColors', 'productsWithSizes'],
        });
    }
};
```

**Behavior:**
- On category page: Uses `router.get()` with `only` option for AJAX request (no full page refresh)
- On other pages: Normal navigation with full page load

The `only` option tells Inertia to only fetch specified props from the server, making navigation faster and smoother.

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
| `Components/shop/HeroBanner.tsx` | Homepage hero carousel |
| `Components/shop/CategoryNav.tsx` | Homepage category icons (glassmorphism) |
| `Components/shop/CartDrawer.tsx` | Slide-out cart panel (Arabic localized) |
| `Components/shop/CartItem.tsx` | Cart item row (localized product names) |
| `Components/shop/WishlistDrawer.tsx` | Slide-out wishlist panel (Arabic localized) |
| `Components/shop/SearchBar.tsx` | Product search input |
| `Components/ui/DualRangeSlider.tsx` | Price range filter |
| `Components/ui/Badge.tsx` | Status badges |

### Contexts
| File | Description |
|------|-------------|
| `contexts/WishlistContext.tsx` | Wishlist state management |
| `contexts/CartContext.tsx` | Cart state + `isInCart` helper |

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
| color | string/null | Color variant name |
| color_hex | string/null | Hex code for color display |
| available_sizes | JSON/null | Array of available sizes |
| size_stock | JSON/null | Stock per size object |
| product_group | string/null | Groups color variants together |

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
