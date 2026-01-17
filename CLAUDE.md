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
8. [Authentication Pages](#authentication-pages)
9. [UI Effects & Animations](#ui-effects--animations)
10. [SPA Navigation](#spa-navigation)
11. [Progressive Loading](#progressive-loading)
12. [Performance Optimizations](#performance-optimizations)
13. [Responsive Design](#responsive-design)
14. [File Reference](#file-reference)
15. [Database & Seeding](#database--seeding)
16. [Image Handling](#image-handling)
17. [Data Models](#data-models)
18. [Common Issues & Solutions](#common-issues--solutions)

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
| Admin | admin@hardrock-demo.com | demo1234 |
| Customer | customer@hardrock-demo.com | demo1234 |

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
│   ├── nav.json
│   ├── checkout.json
│   ├── profile.json
│   └── auth.json
└── ar/
    ├── common.json
    ├── shop.json
    ├── nav.json
    ├── checkout.json
    ├── profile.json
    └── auth.json
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
- Email fields can stay LTR even in Arabic mode (emails are always left-to-right)
- Password fields need special handling for RTL (see Authentication Pages section)

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
| Discount | Dynamic Checkboxes | Discount range brackets (10-19%, 20-29%, etc.) |

**Filter Order (Desktop & Mobile):**
1. New Arrivals
2. Price
3. Availability
4. Color Options (conditional - only shows if products have colors)
5. Size Options (conditional - only shows if products have sizes)
6. Discount (dynamic brackets based on available discounts)

### Discount Bracket System

Discount filters show **only brackets that have products** in the current category. Uses **half-open intervals `[min%, max%)`** to avoid gaps.

**Bracket Structure:**
| Range | Display Label | Filter Logic |
|-------|---------------|--------------|
| `[10%, 20%)` | "10-19% Off" | 10% ≤ discount < 20% |
| `[20%, 30%)` | "20-29% Off" | 20% ≤ discount < 30% |
| `[30%, 40%)` | "30-39% Off" | 30% ≤ discount < 40% |
| `[40%, 50%)` | "40-49% Off" | 40% ≤ discount < 50% |
| `[50%, 60%)` | "50-59% Off" | 50% ≤ discount < 60% |
| `[60%, 70%)` | "60-69% Off" | 60% ≤ discount < 70% |
| `[70%, 100%)` | "70%+ Off" | 70% ≤ discount |

**Backend Data Structure:**
```php
$availableDiscountBrackets = [
    ['min' => 10, 'max' => 20, 'label_max' => 19, 'count' => 5],
    ['min' => 40, 'max' => 50, 'label_max' => 49, 'count' => 3],
    // Only includes brackets with products
];
```

- `min`: Lower bound (inclusive) for filtering
- `max`: Upper bound (exclusive) for filtering
- `label_max`: Display value for label (e.g., 19 for "10-19%")
- `count`: Number of products in this bracket

**SQL Logic (half-open interval):**
```php
// discount % = ((compare_price - price) / compare_price) * 100
// Rearranged: price = compare_price * (1 - discount/100)

$lowerMultiplier = 1 - ($minDiscount / 100);  // e.g., 0.9 for 10%
$upperMultiplier = 1 - ($maxDiscount / 100);  // e.g., 0.8 for 20%

// Range [min%, max%) - inclusive lower, exclusive upper
$query->whereRaw('price <= compare_price * ?', [$lowerMultiplier]);
if ($maxDiscount < 100) {
    $query->whereRaw('price > compare_price * ?', [$upperMultiplier]);
}
```

**Frontend Filter State:**
```typescript
interface Filters {
    min_discount?: number;  // Lower bound (inclusive)
    max_discount?: number;  // Upper bound (exclusive)
    // ... other filters
}
```

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

### Discount Filter Translation Keys (shop.json)

```json
"filterLabels": {
    "discountRange": "{{min}}-{{max}}% Off" / "خصم {{min}}-{{max}}%",
    "discountRangeOpen": "{{min}}%+ Off" / "خصم {{min}}%+"
},
"activeFilters": {
    "discountRange": "{{min}}-{{max}}% Off" / "خصم {{min}}-{{max}}%",
    "discountRangeOpen": "{{min}}%+ Off" / "خصم {{min}}%+"
}
```

---

## Authentication Pages

### Overview

Login and Register pages support full Arabic localization with proper RTL handling.

Files:
- `Pages/Auth/Login.tsx`
- `Pages/Auth/Register.tsx`

### Translation Keys (auth.json)

**Login namespace:**
```json
"login": {
    "title": "Log in" / "تسجيل الدخول",
    "welcome": "Welcome back!" / "مرحباً بعودتك!",
    "enterDetails": "Please enter your details" / "يرجى إدخال بياناتك",
    "email": "Email" / "البريد الإلكتروني",
    "password": "Password" / "كلمة المرور",
    "rememberMe": "Remember for 30 days" / "تذكرني لمدة ٣٠ يوم",
    "forgotPassword": "Forgot password?" / "نسيت كلمة المرور؟",
    "logIn": "Log in" / "تسجيل الدخول",
    "loggingIn": "Logging in..." / "جاري تسجيل الدخول...",
    "noAccount": "Don't have an account?" / "ليس لديك حساب؟",
    "signUp": "Sign up" / "إنشاء حساب",
    "orContinueWith": "or continue with" / "أو المتابعة عبر",
    "continueWithGoogle": "Continue with Google" / "المتابعة عبر جوجل"
}
```

**Register namespace:**
```json
"register": {
    "title": "Sign Up" / "إنشاء حساب",
    "createAccount": "Create Account" / "إنشاء حساب",
    "fillDetails": "Fill in your details to get started" / "أدخل بياناتك للبدء",
    "fullName": "Full Name" / "الاسم الكامل",
    "email": "Email" / "البريد الإلكتروني",
    "password": "Password" / "كلمة المرور",
    "confirmPassword": "Confirm Password" / "تأكيد كلمة المرور",
    "signUp": "Sign Up" / "إنشاء حساب",
    "alreadyHaveAccount": "Already have an account?" / "لديك حساب بالفعل؟"
}
```

### RTL Password Field Handling

Password fields require special handling for RTL text input. The `dir` attribute alone doesn't work reliably - use inline styles instead:

```typescript
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

<input
    type={showPassword ? 'text' : 'password'}
    style={isRTL ? { direction: 'rtl', textAlign: 'right' } : undefined}
    className={`... ${isRTL ? "pl-10 pr-3" : "pl-3 pr-10"}`}
/>

{/* Toggle password visibility button - position swaps for RTL */}
<button
    className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}
>
    {showPassword ? <EyeOff /> : <Eye />}
</button>
```

**Key points:**
- Use inline `style` for `direction: 'rtl'` and `textAlign: 'right'` (more reliable than `dir` attribute)
- Swap padding: `pl-10 pr-3` for RTL (left padding for eye button, minimal right padding for text)
- Move eye button to left side in RTL mode
- Email fields can stay LTR (emails are always left-to-right)

### Google OAuth Integration

Both pages include Google sign-in button linking to `/auth/google`:
```tsx
<a href="/auth/google" className="...">
    <svg>...</svg> {/* Google icon */}
    <span>{t('auth:login.continueWithGoogle')}</span>
</a>
```

---

## UI Effects & Animations

### Homepage Category Navigation

File: `Components/shop/CategoryNav.tsx`

Category navigation uses **image-based cards** with category images covering the full card area and text positioned below.

**Image Mapping:**
```typescript
const categoryImages: Record<string, string> = {
    'electronics': '/images/home_mini/ELECTRONICS@2x.webp',
    'skincare': '/images/home_mini/SKINCARE@2x.webp',
    'building-blocks': '/images/home_mini/BLOCKS@2x.webp',
    'fashion': '/images/home_mini/FASHION@2x.webp',
    'home-kitchen': '/images/home_mini/HOME&KITCHEN@2x.webp',
    'sports': '/images/home_mini/SPORT@2x.webp',
    'stationery': '/images/home_mini/STATIONARY@2x.webp',
    'kids': '/images/home_mini/KIDS@2x.webp',
};
```

**Layout:**
- Image covers full card area (`w-full aspect-square`)
- Category name text positioned below the card
- Responsive grid: 2 cols (mobile) → 4 cols (tablet) → 8 cols (desktop)

**Effects:**
- Card: rounded corners, border, subtle shadow
- Hover: scale up (105%), lift (-translate-y-1), shadow glow
- Image zoom on hover (scale-110)
- Text color change on hover (gray → brand-purple)

### Hero Banner Carousel

File: `Components/shop/HeroBanner.tsx`

Auto-rotating banner carousel with navigation arrows (no dot indicators).

**Features:**
- Auto-advances every 5 seconds
- Left/right arrow navigation (RTL-aware)
- Keyboard navigation (arrow keys)
- Responsive images (desktop/mobile variants)
- RTL support: arrow directions swap for Arabic

**Slide Structure:**
```typescript
interface Slide {
    id: number;
    desktopImage: string;
    mobileImage: string;
    link: string;
    alt: string;      // English alt text
    altAr: string;    // Arabic alt text
}
```

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
            only: [
                'category',
                'subcategories',
                'products',
                'filters',
                'priceRange',
                'productsWithColors',
                'productsWithSizes',
                'maxDiscount',
                'availableDiscountBrackets',
            ],
        });
    }
};
```

**Behavior:**
- On category page: Uses `router.get()` with `only` option for AJAX request (no full page refresh)
- On other pages: Normal navigation with full page load

The `only` option tells Inertia to only fetch specified props from the server, making navigation faster and smoother.

**Important:** When adding new category page props to `LandingController.php`, also add them to the `only` array in `ShopLayout.tsx` to ensure SPA navigation receives the updated data.

---

## Progressive Loading

### Overview

The application uses Inertia.js deferred props (`Inertia::defer()`) to implement progressive loading. This allows the page shell to render immediately while heavy data loads asynchronously.

### How It Works

**Backend (Laravel):**
```php
return Inertia::render('Shop/Home', [
    // Immediate props - render right away
    'categories' => $categories,

    // Deferred props - load after initial render
    'featuredCategories' => Inertia::defer(fn () => $this->getProducts(), 'featured'),
    'saleProducts' => Inertia::defer(fn () => $this->getSaleProducts(), 'sale'),
]);
```

**Frontend (React):**
```tsx
import { Deferred } from '@inertiajs/react';

// Wrap deferred content with fallback skeleton
<Deferred data="featuredCategories" fallback={<ProductGridSkeleton count={8} />}>
    {featuredCategories.map(category => (
        <CategorySection key={category.slug} {...category} />
    ))}
</Deferred>
```

### Deferred Groups

Props can be grouped to load together:
- `'featured'` - Featured category products
- `'sale'` - Sale products section
- `'products'` - Category page product grid
- `'filterMeta'` - Filter metadata (price range, discount brackets)
- `'reviews'` - Product reviews section
- `'related'` - Related products
- `'userReview'` - User review status

### Pages Using Progressive Loading

| Page | Immediate Props | Deferred Props |
|------|-----------------|----------------|
| **Home** | categories | featuredCategories, saleProducts |
| **Category** | category, subcategories, filters, sort | products, priceRange, productsWithColors, productsWithSizes, maxDiscount, availableDiscountBrackets |
| **Product** | product, breadcrumbs | reviews, ratingDistribution, relatedProducts, canReview, userReview |

### ProductGridSkeleton Component

File: `Components/shop/ProductGridSkeleton.tsx`

Animated placeholder while products load:
```tsx
<ProductGridSkeleton count={8} />  // 8 skeleton cards
<ProductGridSkeleton count={12} /> // 12 skeleton cards
```

### Default Values for Deferred Props

When using deferred props, provide default values in the component to prevent errors during initial render:

```tsx
export default function Category({
    products,
    priceRange = { min: 0, max: 1000 },  // Default fallback
    productsWithColors = 0,
    productsWithSizes = 0,
    availableDiscountBrackets = [],
}: Props) {
    // Safe access for potentially undefined deferred data
    const total = products?.total ?? 0;
}
```

### Benefits

1. **Faster perceived load time** - Page structure visible immediately
2. **Better UX** - Users see content loading progressively
3. **Railway optimization** - Reduces time-to-first-byte on slower deployments
4. **Parallel loading** - Different data groups can load concurrently

---

## Performance Optimizations

### Database Indexes

#### Products Table Indexes

Migration: `database/migrations/2026_01_14_123825_add_category_price_composite_index_to_products_table.php`

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `products_category_price_idx` | `category_id, is_active, price` | Price range queries (MIN/MAX) |
| `products_category_discount_idx` | `category_id, is_active, compare_price, price` | Discount calculations |
| `products_category_color_idx` | `category_id, is_active, color` | Color filter queries |
| `products_category_active_idx` | `category_id, is_active` | General category filtering |
| `products_active_sale_idx` | `is_active, compare_price` | Sale products query |
| `products_active_popular_idx` | `is_active, times_purchased` | Popular products sorting |
| `products_active_newest_idx` | `is_active, created_at` | Newest products sorting |
| `products_active_price_idx` | `is_active, price` | Price filtering |

**Note:** JSON columns (`available_sizes`, `size_stock`) cannot be indexed directly in MySQL.

### Query Caching

Filter metadata is cached for 10 minutes to reduce database load:

```php
private function getPriceRange(array $categoryIds): array
{
    $cacheKey = 'category_price_range_' . implode('_', $categoryIds);

    return Cache::remember($cacheKey, 600, function () use ($categoryIds) {
        // Query executes only if cache miss
        return [...];
    });
}
```

**Cached queries:**
| Method | Cache Key Pattern | TTL |
|--------|------------------|-----|
| `getPriceRange()` | `category_price_range_{ids}` | 10 min |
| `getProductsWithColors()` | `category_products_with_colors_{ids}` | 10 min |
| `getProductsWithSizes()` | `category_products_with_sizes_{ids}` | 10 min |
| `getMaxDiscount()` | `category_max_discount_{ids}` | 10 min |
| `getDiscountBrackets()` | `category_discount_brackets_{ids}` | 10 min |

### Parameterized Queries (SQL Injection Prevention)

All raw SQL queries use parameterized placeholders:

```php
// CORRECT - Parameterized
$placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
$result = DB::selectOne("
    SELECT MIN(price) as min_price, MAX(price) as max_price
    FROM products
    WHERE category_id IN ({$placeholders}) AND is_active = 1
", $categoryIds);

// WRONG - String interpolation (SQL injection risk)
$ids = implode(',', $categoryIds);
$result = DB::selectOne("SELECT ... WHERE category_id IN ({$ids})");
```

### Home Page Optimization

**Query limits:**
- Featured categories: 8 products per category (not all products)
- Sale products: Top 50 by discount, then filter in PHP
- Categories: Only parent categories with `withCount('activeProducts')`

```php
// OPTIMIZED: Query with LIMIT
Product::whereIn('category_id', $categoryIds)
    ->active()
    ->orderBy('times_purchased', 'desc')
    ->take(8)  // Limit in SQL, not PHP
    ->get();
```

### Image Lazy Loading

Product images use native lazy loading:
```tsx
<img loading="lazy" src={imageUrl} alt={productName} />
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
| `Pages/Auth/Login.tsx` | Login page (Arabic localized, RTL support) |
| `Pages/Auth/Register.tsx` | Registration page (Arabic localized, RTL support) |

### Key Components
| File | Description |
|------|-------------|
| `Components/shop/ProductCard.tsx` | Product card in grids |
| `Components/shop/ProductGrid.tsx` | Product grid layout |
| `Components/shop/ProductGridSkeleton.tsx` | Skeleton loader for progressive loading |
| `Components/shop/HeroBanner.tsx` | Homepage hero carousel (arrows, no dots) |
| `Components/shop/CategoryNav.tsx` | Homepage category images (full-card images) |
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
| Category banners | `public/images/banners/categories/` | `/images/banners/categories/...` |
| Homepage category icons | `public/images/home_mini/` | `/images/home_mini/...` |
| Hero banners (desktop) | `public/images/banners/desktop/` | `/images/banners/desktop/...` |
| Hero banners (mobile) | `public/images/banners/mobile/` | `/images/banners/mobile/...` |

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

### SPA Navigation State Sync
When using Inertia's `router.get()` with `only` option, React local state may not update automatically. Use `useEffect` with comprehensive dependencies to reset local state when props change:

```typescript
// Category.tsx - Reset filter state when category changes via SPA navigation
useEffect(() => {
    setLocalFilters({
        new_arrivals: filters.new_arrivals || false,
        min_price: filters.min_price,
        max_price: filters.max_price,
        min_discount: filters.min_discount,
        max_discount: filters.max_discount,
        // ... other filters
    });
    setSliderMin(filters.min_price || priceRange.min);
    setSliderMax(filters.max_price || priceRange.max);
}, [category.id, priceRange.min, priceRange.max, filters.min_price, filters.max_price, filters.min_discount, filters.max_discount, /* ... */]);
```

**Key:** Include `category.id` as a dependency to trigger reset when navigating between categories.

### Discount Range Math (Half-Open Intervals)
When filtering by percentage ranges, use half-open intervals `[min%, max%)` to avoid gaps:
- **Problem:** Products with x9.xx% discounts (e.g., 49.09%) fall between brackets when using inclusive bounds
- **Solution:** Lower bound inclusive, upper bound exclusive
- **Example:** 49.09% discount matches `[40%, 50%)` bracket because `49.09 >= 40` AND `49.09 < 50`

### RTL Password Input Fields
The `dir="rtl"` attribute doesn't reliably work for password input fields. Use inline styles instead:
```typescript
// Problem: dir attribute doesn't apply RTL text direction
<input type="password" dir="rtl" /> // Doesn't work!

// Solution: Use inline styles
<input
    type="password"
    style={{ direction: 'rtl', textAlign: 'right' }}
/>
```
Also remember to swap padding and reposition the toggle button (see Authentication Pages section).

### Deferred Props TypeError on Initial Render
When using `Inertia::defer()`, props are `undefined` during initial render. Always provide default values:
```typescript
// Problem: TypeError when accessing deferred prop properties
export default function Category({ products, priceRange }: Props) {
    return <div>{priceRange.min}</div>;  // TypeError: Cannot read property 'min' of undefined
}

// Solution: Default values in destructuring
export default function Category({
    products,
    priceRange = { min: 0, max: 1000 },  // Default fallback
}: Props) {
    // Also use optional chaining for nested access
    const total = products?.total ?? 0;
}
```

### MySQL Index Key Length Error
MySQL has a max key length of 3072 bytes. JSON columns cannot be indexed:
```php
// Problem: Key too long error
$table->index(['category_id', 'is_active', 'available_sizes']);  // Fails - JSON column

// Solution: Don't index JSON columns, use separate indexed flags if needed
$table->index(['category_id', 'is_active', 'color']);  // Works - varchar column
```

### Database Connection "No Database Selected"
If you see `SQLSTATE[3D000]: Invalid catalog name: 1046 No database selected`:
1. Check `.env` file has `DB_DATABASE=hardrock_ecom_demo` (not empty)
2. Run `php artisan config:clear` after changes
3. Restart the dev server
