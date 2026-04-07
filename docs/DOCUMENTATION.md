# HardRock E-Commerce Platform — Full Documentation

> A comprehensive, production-ready e-commerce platform built with Laravel 12, React 18, Inertia.js v2, and TypeScript. Fully bilingual (English & Arabic) with RTL support, deployed on Railway.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Customer-Facing Features](#3-customer-facing-features)
   - [Homepage](#31-homepage)
   - [Category & Product Browsing](#32-category--product-browsing)
   - [Product Detail Page](#33-product-detail-page)
   - [Search](#34-search)
   - [Shopping Cart](#35-shopping-cart)
   - [Wishlist](#36-wishlist)
   - [Checkout & Orders](#37-checkout--orders)
   - [Customer Profile](#38-customer-profile)
   - [Reviews & Ratings](#39-reviews--ratings)
   - [Coupons & Discounts](#310-coupons--discounts)
   - [Authentication](#311-authentication)
4. [Admin Panel](#4-admin-panel)
   - [Dashboard](#41-dashboard)
   - [Product Management](#42-product-management)
   - [Category Management](#43-category-management)
   - [Order Management](#44-order-management)
   - [User Management](#45-user-management)
   - [Review Management](#46-review-management)
   - [Coupon Management](#47-coupon-management)
   - [Reports & Analytics](#48-reports--analytics)
   - [Settings](#49-settings)
   - [Activity Log & Undo System](#410-activity-log--undo-system)
5. [Localization (i18n)](#5-localization-i18n)
6. [Performance & Optimization](#6-performance--optimization)
7. [Security](#7-security)
8. [Database Schema](#8-database-schema)
9. [Deployment](#9-deployment)
10. [Project Structure](#10-project-structure)

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | Laravel 12 | PHP MVC framework, routing, middleware, Eloquent ORM |
| **SPA Bridge** | Inertia.js v2 | Connects Laravel backend to React frontend without a separate API |
| **Frontend Framework** | React 18 | Component-based UI with hooks and context |
| **Language** | TypeScript | Type-safe JavaScript for the entire frontend |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Localization** | i18next + react-i18next | Bilingual support (English & Arabic) |
| **Authentication** | Laravel Sanctum | Session-based auth with CSRF protection |
| **OAuth** | Laravel Socialite | Google sign-in integration |
| **Database** | MySQL | Relational data storage |
| **Cache & Sessions** | Redis | Fast caching and session management |
| **Excel Export** | PHPSpreadsheet (maatwebsite/excel) | Excel/CSV data export |
| **JS Routing** | Ziggy | Exposes Laravel named routes to JavaScript |
| **Build Tool** | Vite | Fast frontend bundling and HMR |
| **Icons** | Lucide React | Consistent icon set throughout the UI |
| **Hosting** | Railway | Cloud platform with MySQL & Redis services |

### Key Dependencies

**PHP (composer.json):**
- `inertiajs/inertia-laravel` v2.0 — SPA bridge
- `laravel/sanctum` v4.0 — API/session authentication
- `laravel/socialite` v5.24 — OAuth providers
- `maatwebsite/excel` v3.1 — Spreadsheet import/export
- `tightenco/ziggy` v2.0 — Named routes in JS

**JavaScript (package.json):**
- `@inertiajs/react` — React adapter for Inertia
- `react` 18 + `react-dom` 18 — UI framework
- `i18next` + `react-i18next` — Internationalization
- `tailwindcss` — Utility CSS
- `lucide-react` — Icon library
- `recharts` — Charts for admin dashboard (lazy-loaded)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  React   │  │  Inertia  │  │  i18next (EN/AR) │  │
│  │ Pages &  │◄─┤  Client   │  │  RTL Support     │  │
│  │Components│  │  Adapter  │  └──────────────────┘  │
│  └──────────┘  └─────┬─────┘                        │
│        ▲              │                              │
│  ┌─────┴──────────────┴─────────────────┐            │
│  │  Contexts: Cart, Wishlist, Language   │            │
│  └──────────────────────────────────────┘            │
└──────────────────────┬──────────────────────────────┘
                       │  Inertia Protocol (XHR / JSON)
┌──────────────────────▼──────────────────────────────┐
│                  Laravel 12 Backend                   │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Controllers  │  │  Services  │  │  Middleware   │  │
│  │ Shop/ Admin/ │  │ Cart,      │  │ auth, admin,  │  │
│  │             │  │ Checkout,  │  │ verified      │  │
│  │             │  │ ActivityLog│  │               │  │
│  └──────┬──────┘  └─────┬──────┘  └──────────────┘  │
│         │               │                            │
│  ┌──────▼───────────────▼──────┐  ┌──────────────┐  │
│  │     Eloquent ORM / Models   │  │    Redis      │  │
│  │  User, Product, Order,      │  │  Cache +      │  │
│  │  Category, Review, Coupon   │  │  Sessions     │  │
│  └──────────────┬──────────────┘  └──────────────┘  │
└─────────────────┼────────────────────────────────────┘
                  │
           ┌──────▼──────┐
           │    MySQL     │
           │  Database    │
           └─────────────┘
```

### How Inertia.js Works

Inertia.js eliminates the need for a separate REST/GraphQL API. Instead:

1. Laravel controllers return `Inertia::render('PageName', $props)` instead of JSON or Blade views.
2. On the first request, the server returns a full HTML page with the React app bootstrapped.
3. On subsequent navigations, Inertia intercepts link clicks and makes XHR requests that return only JSON props.
4. The React component for the target page receives the props and renders — no full page reload.

This gives the **developer experience of a traditional server-rendered app** (routes, middleware, validation in PHP) with the **user experience of a single-page application** (instant transitions, no page flicker).

---

## 3. Customer-Facing Features

### 3.1 Homepage

**File:** `Pages/Shop/Home.tsx`

The homepage is the storefront's landing page and uses **progressive loading** (Inertia deferred props) so the page shell renders instantly while product data loads asynchronously.

**Sections:**

| Section | Description | Loading |
|---------|-------------|---------|
| **Hero Banner Carousel** | Auto-rotating image carousel with left/right arrows. Advances every 5 seconds. Supports RTL arrow direction. Desktop and mobile image variants per slide. | Immediate |
| **Category Navigation** | Grid of 8 category image cards (Electronics, Skincare, Building Blocks, Fashion, Home & Kitchen, Sports, Stationery, Kids). Hover effects: scale up, shadow glow, image zoom. Responsive: 2 cols → 4 cols → 8 cols. | Immediate |
| **Featured Category Sections** | Each category shows up to 8 of its top-selling products in a horizontal row. Product cards show image, name, price, discount badge, rating, and wishlist/cart buttons. | Deferred (skeleton fallback) |
| **Sale Products** | Dedicated section showing products currently on sale (have a `compare_price` higher than `price`). Shows discount percentage badges. | Deferred (skeleton fallback) |

**Components used:**
- `HeroBanner.tsx` — Carousel with keyboard navigation and RTL support
- `CategoryNav.tsx` — Image-based category grid cards
- `FeaturedCategorySection.tsx` — Horizontal product rows per category
- `ProductCard.tsx` — Reusable product card with wishlist toggle, add-to-cart, price formatting
- `ProductGridSkeleton.tsx` — Animated placeholder while products load

---

### 3.2 Category & Product Browsing

**File:** `Pages/Shop/Category.tsx`

When a customer clicks on a category, they land on a full category page with advanced filtering, sorting, and product grid display.

**Page Structure:**

1. **Category Banner** — Full-width banner image (language-specific: `electronics-en.webp` / `electronics-ar.webp`)
2. **Subcategory Navigation** — Horizontal scrollable row of subcategory pills. RTL-aware scroll buttons (arrow direction swaps for Arabic).
3. **Filter Sidebar (Desktop)** — Left-side panel with all filter controls
4. **Filter Panel (Mobile)** — Bottom sheet with two-panel layout (filter categories on left, options on right)
5. **Sort Controls** — Dropdown for sort order + grid density toggle
6. **Product Grid** — Responsive grid of product cards with pagination
7. **Active Filter Tags** — Removable chips showing currently applied filters

**Available Filters:**

| Filter | Type | Description |
|--------|------|-------------|
| New Arrivals | Checkbox | Products added in the last 30 days |
| Price Range | Dual-handle slider | Min/max price with Arabic numeral support |
| Availability | Checkbox | Show only in-stock products |
| Has Color Options | Checkbox | Products with color variants (shown conditionally) |
| Has Size Options | Checkbox | Products with size variants (shown conditionally) |
| Discount Ranges | Checkboxes | Dynamic brackets (10-19%, 20-29%, etc.) — only shows brackets that have products |

**Sort Options:**
- Newest first
- Most popular (by purchase count)
- Best rated
- Price: Low to High
- Price: High to Low

**SPA Navigation:** When navigating between categories while already on a category page, Inertia's `router.get()` with the `only` option fetches only the changed props (products, filters, price range, etc.) without a full page reload — making category-to-category navigation instant.

---

### 3.3 Product Detail Page

**File:** `Pages/Shop/Product.tsx`

A rich product page with image gallery, variant selection, reviews, and related products.

**Sections:**

| Section | Description |
|---------|-------------|
| **Breadcrumbs** | Category → Subcategory → Product Name |
| **Image Gallery** | Main image with thumbnail strip. Click thumbnails to switch. Each image can represent a different color variant. |
| **Product Info** | Name (bilingual), price, compare price with discount %, short description, SKU |
| **Color Selection** | Thumbnails for each color variant. Clicking switches the main image. |
| **Size Selection** | Size buttons (S, M, L, XL, etc.) with per-size stock display. Out-of-stock sizes are disabled with strikethrough. "Please select a size" prompt until selected. |
| **Quantity Selector** | +/- buttons with stock limit enforcement |
| **Add to Cart** | Disabled until size is selected (for variant products). Shows "In Cart" if already added. |
| **Wishlist Toggle** | Heart icon to add/remove from wishlist |
| **Full Description** | Expandable product description (bilingual) |
| **Reviews Section** | Star rating histogram, individual reviews with helpful voting, verified purchase badges |
| **Write a Review** | Form for authenticated users who purchased the product |
| **Related Products** | Product cards from the same category |

**Deferred Loading Groups:**
- `reviews` — Review list and rating distribution
- `related` — Related products from the same category
- `userReview` — Whether the current user can review / has reviewed

**View Count Deduplication:** Each page visit only increments `view_count` once per session. Inertia's deferred prop requests (which hit the same controller) are deduplicated via session keys to prevent 4x inflation.

---

### 3.4 Search

**File:** `Pages/Shop/Search.tsx`

Full-text search across products with filtering and sorting.

- Search by product name, description, or SKU
- Filter results by category
- Sort results (newest, popular, best-rated, price)
- Paginated results grid
- Bilingual product names displayed based on current language

---

### 3.5 Shopping Cart

**Files:** `contexts/CartContext.tsx`, `Components/shop/CartDrawer.tsx`, `Pages/Shop/Cart.tsx`

The cart system is server-side (session-based for guests, database-backed for logged-in users) with optimistic UI updates on the frontend.

**Cart Drawer (Slide-out Panel):**
- Triggered by clicking the cart icon in the header
- Shows all cart items with images, names, prices, quantities
- Quantity controls (+/-) with debounced server sync (300ms)
- Remove item button
- Subtotal calculation
- "View Cart" and "Checkout" buttons
- Localized product names and Arabic numeral formatting

**Cart Page (`/cart`):**
- Full-page cart with detailed item display
- Quantity editing with stock validation
- Color and size variant display per item
- Price subtotals per item and overall
- Free delivery threshold indicator (100 JOD)
- Continue shopping and proceed to checkout buttons

**Cart Features:**
- **Optimistic Updates** — UI updates immediately; server syncs in background
- **Debounced Quantity Changes** — Prevents excessive server requests
- **Guest-to-User Cart Merge** — When a guest logs in, their session cart merges with their user cart
- **Variant Tracking** — Cart items store selected color, color_hex, size, and selected_image_id
- **Stock Validation** — Prevents adding more than available stock
- **Pending Removals** — Items being removed are visually faded before server confirms

**CartContext API:**
```typescript
addToCart(productId, quantity, color?, colorHex?, size?, imageId?)
updateQuantity(itemId, quantity)
removeItem(itemId)
isInCart(productId)
refreshCart()
```

---

### 3.6 Wishlist

**File:** `contexts/WishlistContext.tsx`, `Components/shop/WishlistDrawer.tsx`

The wishlist is a client-side feature using localStorage for persistence.

- Add/remove products with a heart icon toggle
- Wishlist drawer slides out from the right side
- Items stay in wishlist even after being added to cart (shows "In Cart" badge in orange)
- "Clear Wishlist" button to remove all items
- Wishlist heart icon in the header pulses every 10 seconds when items are present
- Localized product names based on current language

**WishlistContext API:**
```typescript
addToWishlist(product)
removeFromWishlist(productId)
toggleWishlist(product)
isInWishlist(productId)
clearWishlist()
```

---

### 3.7 Checkout & Orders

**Files:** `Pages/Shop/Checkout.tsx`, `Pages/Shop/OrderConfirmation.tsx`, `Pages/Shop/OrderHistory.tsx`

**Checkout Page (`/checkout`):**
- Requires authentication (redirects to login if not logged in)
- **Customer Information Form:**
  - Full name, email, phone
  - Shipping address fields (address line, city, state, postal code)
  - Billing address (same as shipping or separate)
- **Order Summary:**
  - All cart items with quantities and prices
  - Subtotal, tax, shipping fee
  - Coupon code input with apply/remove
  - Discount display
  - Final total
- **Payment Method:**
  - Cash on Delivery
- **Place Order / WhatsApp Order:**
  - Standard checkout creates an order in the database
  - WhatsApp checkout generates a pre-formatted WhatsApp message with order details
- **Validations:**
  - All required fields validated server-side
  - Stock availability verified before order creation
  - Coupon validity re-checked at checkout

**Order Confirmation (`/order/{order}/confirmation`):**
- Order number and date
- Items ordered with prices
- Shipping address
- Payment method
- Order total
- Tracking information (if available)

**Order History (`/orders`):**
- List of all customer orders
- Status badge per order (pending, processing, shipped, delivered, cancelled)
- Order date, total, item count
- Click to view full order details

**Order Processing Flow:**
1. Customer fills checkout form and clicks "Place Order"
2. `CheckoutService` validates stock and coupon
3. Order record created with generated order number (format: `HR-YYMMDD-XXXX`)
4. Stock decremented for each item
5. Coupon usage incremented (if used)
6. Cart cleared
7. Customer redirected to order confirmation page

---

### 3.8 Customer Profile

**File:** `Pages/Shop/Profile.tsx`

A multi-tab profile page for managing account settings.

**Tabs:**

| Tab | Features |
|-----|----------|
| **Overview** | Display name, email, phone, avatar, member since date, email verification status |
| **Orders** | Paginated order history with status, dates, and totals |
| **Coupons** | Available coupons the customer can use (code, discount, conditions, expiry) |
| **Settings** | Update name, email, phone; change password; upload/remove avatar; delete account |

**Profile Features:**
- **Avatar Upload** — Image upload with preview, stored in `storage/app/public/`
- **Password Change** — Current password verification + new password with confirmation
- **Account Deletion** — Requires password confirmation, permanently deletes account and data
- **Email Verification Status** — Shows verified badge or unverified warning with resend option

---

### 3.9 Reviews & Ratings

**Files:** Product page section + `ReviewController`

Customers can review products they have purchased.

- **5-Star Rating System** — Click to set rating (1-5 stars)
- **Review Form** — Title and comment fields (bilingual support)
- **Verified Purchase Badge** — Automatically shown if the reviewer purchased the product
- **Helpful Votes** — Other users can mark reviews as helpful (one vote per user)
- **Rating Distribution** — Histogram showing count of 1-5 star reviews
- **Average Rating** — Displayed on product cards and detail page
- **Review Editing** — Users can update or delete their own reviews
- **One Review Per Product** — Each user can only review a product once

---

### 3.10 Coupons & Discounts

**Seeded Coupons:**

| Code | Type | Value | Min Order | Max Discount | Description |
|------|------|-------|-----------|--------------|-------------|
| `WELCOME10` | Percentage | 10% off | None | 50 JOD cap | Welcome discount for new customers |
| `SAVE20` | Percentage | 20% off | 50 JOD | 30 JOD cap | Larger discount with minimum spend |
| `FLAT5` | Fixed | 5 JOD off | 25 JOD | N/A | Flat amount discount |

**Coupon Validation Rules:**
- Coupon must be active and not expired
- Start date must have passed (if set)
- Usage limit not exceeded (total uses)
- Per-user limit not exceeded
- Minimum order amount met
- Only one coupon per order

**Customer Flow:**
1. At checkout, enter coupon code in the input field
2. Click "Apply" — server validates and returns discount amount
3. Discount reflected in order summary
4. Click "Remove" to un-apply the coupon
5. Customers can also browse available coupons in their Profile → Coupons tab

---

### 3.11 Authentication

**Pages:** `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `VerifyEmail.tsx`, `ConfirmPassword.tsx`

**Login:**
- Email and password form
- "Remember me for 30 days" checkbox
- "Forgot password?" link
- Google OAuth button ("Continue with Google")
- Link to registration page
- Full Arabic localization with RTL password field handling

**Registration:**
- Full name, email, password, confirm password
- Triggers verification email on registration
- Google OAuth option
- Link to login page

**Google OAuth:**
- Click "Continue with Google" → redirected to Google consent screen
- After approval, redirected back to the app
- New users: account created automatically with `email_verified_at` set (Google verifies email)
- Existing users: linked to Google account, avatar synced
- Race condition protection via `lockForUpdate()` database transaction

**Password Reset:**
- Enter email → receive reset link
- Click link → enter new password
- Token-based verification with signed URLs

**Email Verification:**
- Sent automatically on registration
- Verification page with resend option
- Rate-limited to 6 resend attempts per minute
- Currently NOT required for any features (friction-reduction decision)

**Session & CSRF:**
- Sessions stored in database (configurable to Redis)
- CSRF handled via Inertia v2's cookie-based approach (no meta tag)
- Axios configured with `withCredentials` and `withXSRFToken`

---

## 4. Admin Panel

The admin panel is a full-featured back-office accessible at `/admin`. All admin routes require the `auth` and `admin` middleware.

**Demo Admin Login:**
- Email: `admin@hardrock-demo.com`
- Password: `demo1234`

---

### 4.1 Dashboard

**File:** `Pages/Admin/Dashboard.tsx`

The admin dashboard provides a real-time overview of the store's health with auto-refreshing data (30-second polling).

**Stat Cards (with trend indicators):**

| Stat | Description | Trend |
|------|-------------|-------|
| Total Products | Count of all products | vs. previous period |
| Categories | Total category count | — |
| Total Orders | All orders | % change |
| Revenue | Sum of completed order totals | % change |
| Avg Order Value | Revenue / completed orders | % change |
| Pending Orders | Orders awaiting processing | vs. previous |
| Out of Stock | Products with 0 stock | — |
| Inventory Value | Sum of (price × stock) for all products | — |
| New Customers | Users registered in period | % change |
| Active Coupons | Currently valid coupons | — |

**Dashboard Sections:**

| Section | Description |
|---------|-------------|
| **Order Pipeline** | Status breakdown bar (pending → processing → shipped → delivered → cancelled) with percentages |
| **Revenue by Status** | Revenue split across order statuses |
| **Revenue Chart** | Time-series chart of daily revenue (deferred loading, lazy-loaded recharts) |
| **Top Selling Products** | Ranked by `times_purchased` |
| **Best Rated Products** | Ranked by `average_rating` with review counts |
| **Recent Orders** | 5 most recent orders with quick links |
| **Low Stock Products** | Products nearing 0 stock with severity coloring (red ≤ 3, yellow > 3) |
| **Recent Activities** | Admin activity log (product/category edits) |
| **Recent Reviews** | Latest customer reviews (deferred) |

**Date Range Selector:** Toggle between "Today", "This Week", "This Month" — all stats recalculate dynamically.

**Customization:**
- Toggle visibility of each section
- Reorder sections (move up/down)
- Reset to default layout
- Preferences saved in localStorage

---

### 4.2 Product Management

**Files:** `Pages/Admin/Products/Index.tsx`, `Pages/Admin/Products/Create.tsx`, `Pages/Admin/Products/Edit.tsx`

#### Product Listing

A feature-rich data table with advanced filtering and bulk operations.

**Filtering & Search:**
- Search by product name or SKU
- Filter by category (parent categories include all subcategories)
- Status filters: Active, Inactive, Out of Stock, Low Stock, On Sale, Featured
- Pagination: 4, 8, 16, 32, 64, or 80 items per page
- Column sorting: name, price, stock, rating, created date, purchase count, category

**Views:**
- **Table View** — Resizable columns with sticky scroll, showing image, name, SKU, category, price, stock, rating, status, actions
- **Grid View** — Product cards with image navigation (supports multiple images/colors), stock badge, price, quick action buttons

**Bulk Actions:**
- Select multiple products via checkboxes
- Bulk activate / deactivate
- Bulk delete (with confirmation)
- Bulk export (CSV, Excel, JSON)

**Export:** Supports exporting selected items or the full filtered result set in CSV, Excel (.xlsx), or JSON format.

#### Product Create & Edit

A comprehensive form for managing all product data.

**Basic Fields:**
- Name (English & Arabic)
- Description (English & Arabic) — rich text
- Short Description (English & Arabic)
- Price and Compare Price (for sale items)
- SKU
- Stock level
- Low stock threshold (override per product or inherit from category/global)
- Category selection (with subcategories)
- Active / Featured toggles

**Variant System:**

| Feature | Description |
|---------|-------------|
| **Color Picker** | Preset color swatches + custom hex color picker. Each color linked to a product image. |
| **Size Options** | Configurable size list (S, M, L, XL, XXL, 3XL, 4XL, etc.) |
| **Stock Matrix** | Per color+size stock levels in a grid editor |
| **Image-to-Color Mapping** | Each uploaded image can be assigned a color name |

**Image Management:**
- Multiple image upload (drag & drop or file picker)
- Reorder images via drag handles
- Set primary image
- Assign color to each image
- Delete images
- Image preview gallery with thumbnail navigation

**Advanced Features:**
- **Duplicate Product** — Clone from an existing product
- **Activity Log** — View recent changes with field-level diffs (see Section 4.10)
- **Undo System** — Floating undo button to revert the last change (see Section 4.10)
- **Optimistic Locking** — `loaded_at` timestamp prevents concurrent edit conflicts (see Section 7)
- **Revert Changes** — Bottom bar button resets form to current saved values

---

### 4.3 Category Management

**Files:** `Pages/Admin/Categories/Index.tsx`, `Pages/Admin/Categories/Create.tsx`, `Pages/Admin/Categories/Edit.tsx`, `Pages/Admin/Categories/Show.tsx`

**Category Listing:**
- Search by name
- Filter by status (active/inactive)
- Sortable columns: name, product count, status, created date
- Stats cards: Total, Parent, Subcategories, Active, Inactive, Empty categories
- Hierarchical display (subcategories indented under parents)

**Category Create & Edit:**
- Bilingual names (English & Arabic)
- Bilingual descriptions
- URL slug (auto-generated or manual)
- Parent category selector (or leave empty for top-level)
- Category thumbnail image upload
- Sort order for display priority
- Active/Inactive toggle
- Low stock threshold override (per-category setting)

**Category Show:**
- Category details with product listing
- Subcategory listing
- Quick navigation to edit page

---

### 4.4 Order Management

**Files:** `Pages/Admin/Orders/Index.tsx`, `Pages/Admin/Orders/Show.tsx`, `Pages/Admin/Orders/Invoice.tsx`

#### Order Listing

**Dashboard Stats:**
- Total Orders, Pending Orders, Total Revenue, Today's Revenue

**Filtering:**
- Search by order number or customer name
- Status filter: pending, processing, shipped, delivered, cancelled
- Payment status: pending, paid, failed, refunded
- Date presets: Today, Yesterday, This Week, This Month, All Time
- Custom date range picker
- Sorting by date, customer, amount, status

**Order Pipeline:** Visual status breakdown with percentage bars and revenue per status.

**Bulk Actions:**
- Bulk status change (with confirmation dialog)
- Bulk export (CSV, Excel, JSON)

#### Order Detail Page

| Section | Features |
|---------|----------|
| **Order Header** | Order number, date, customer name (linked to user detail), status badge with dropdown to change |
| **Order Items** | Product list with images, names, prices, quantities, subtotals |
| **Pricing Breakdown** | Subtotal, tax, shipping, coupon discount, final total |
| **Shipping Info** | Customer address, phone, email |
| **Tracking** | Input for tracking number and carrier selection, saved to order |
| **Admin Notes** | Internal-only text area for admin comments |
| **Activity Timeline** | Chronological log of order events (created, status changes, tracking updates, notes added) |

**Actions:**
- Change order status via dropdown
- Add/update tracking information
- Write admin notes
- Print invoice (PDF-ready page)

---

### 4.5 User Management

**Files:** `Pages/Admin/Users/Index.tsx`, `Pages/Admin/Users/Edit.tsx`, `Pages/Admin/Users/Show.tsx`

#### User Listing

**Stats Cards:** Total Users, Admins, Customers, Verified, Unverified, New Users (last 30 days)

**Filtering:**
- Search by name or email
- Role filter: admin, customer
- Sortable columns: name, email, role, registration date

**Display:** Avatar (uploaded image or initials fallback), name, email, role badge, verification status

#### User Detail Page

| Section | Content |
|---------|---------|
| **Profile Info** | Name, email, phone, avatar, role, verification status, registration date, last login |
| **Customer Stats** | Total orders, completed orders, total spent, average order value, highest order, reviews written, average rating given |
| **Order History** | Paginated list of user's orders with status and amounts |
| **Review History** | Reviews written by this user with ratings and products |
| **Top Products** | Products most frequently purchased by this user |

**Admin Actions:**
- Edit user profile (name, email, phone, avatar)
- Send password reset email
- Resend email verification (rate-limited: 10/hour)
- Delete user (customers only — admins cannot be deleted)
- Roles are immutable and cannot be changed through the UI

---

### 4.6 Review Management

**Files:** `Pages/Admin/Reviews/Index.tsx`, `Pages/Admin/Reviews/Show.tsx`

**Review Listing:**

**Stats:** Total reviews, average rating, verified purchase count, rating distribution (1-5 star breakdown)

**Filtering:**
- Search by reviewer name, email, product name, review title/content
- Rating filter: 1, 2, 3, 4, or 5 stars
- Verified purchase filter: yes/no
- Filter by specific product
- Sorting: date, rating, helpful count, title, product, customer

**Table Display:** Star rating (color-coded), review title & snippet, product name, customer name with avatar, date, helpful count, verified purchase badge

**Bulk Actions:** Bulk delete reviews

**Review Detail Page:** Full review text, product info with image, reviewer info, rating, helpful count, verified purchase indicator, delete option

---

### 4.7 Coupon Management

**Files:** `Pages/Admin/Coupons/Index.tsx`, `Pages/Admin/Coupons/Create.tsx`, `Pages/Admin/Coupons/Edit.tsx`

**Coupon Listing:**

**Stats:** Total coupons, active count, expired count, total uses, total savings generated

**Filtering:**
- Search by code or name
- Status: active, inactive, expired
- Type: percentage, fixed amount
- Started filter: started / not started
- Sorting: code, uses, value, expiry

**Table Display:** Code, type & value, usage (count / limit), dates, status toggle, edit/delete actions

**Coupon Create & Edit:**

| Field | Description |
|-------|-------------|
| Code | Unique, uppercase coupon code |
| Name (EN/AR) | Bilingual display names |
| Description (EN/AR) | Bilingual descriptions |
| Type | Percentage or Fixed Amount |
| Value | Discount percentage or JOD amount |
| Max Discount | Cap on percentage discount amount |
| Min Order Amount | Minimum cart subtotal required |
| Usage Limit | Maximum total uses across all users |
| Per-User Limit | Maximum uses per individual user |
| Start Date | When the coupon becomes valid |
| Expiry Date | When the coupon expires |
| Active Toggle | Enable/disable the coupon |

---

### 4.8 Reports & Analytics

**File:** `Pages/Admin/Reports/Index.tsx`

A dedicated reporting page with multiple analytics views.

| Report | Metrics |
|--------|---------|
| **Revenue** | Revenue over time (chart), revenue summary with averages, order count, completed orders |
| **Order Analysis** | Orders by status (count & revenue breakdown), order trends |
| **Product Performance** | Top selling products (by quantity), top rated products (by rating), sales per category |
| **Customer Analytics** | Total/new customers, customers with orders, top customers by spending, average customer value |
| **Category Performance** | Products per category, total sold per category, average rating per category |

**Date Range Support:** All time, year-to-date, quarterly, and monthly views.

---

### 4.9 Settings

**File:** `Pages/Admin/Settings/Index.tsx`

System-wide configuration grouped into sections:

| Group | Settings |
|-------|----------|
| **General** | Store name, contact email, store URL, currency display |
| **Currency** | Currency symbol, decimal places, default currency |
| **Inventory** | Low stock threshold (global default), track inventory toggle, low stock notification toggle |

**Form Features:**
- Grouped settings with section icons
- Multiple field types: text, email, number, boolean, textarea, select
- Min/max values for numeric fields
- Descriptions per setting
- RTL support for Arabic content
- Dirty state tracking (warns about unsaved changes)
- Validation per field

---

### 4.10 Activity Log & Undo System

The admin panel includes a comprehensive audit trail and undo mechanism for product and category edits.

#### Activity Log

Every product and category edit is tracked in the `activity_logs` database table with:
- **Who** made the change (admin user ID)
- **When** the change was made (timestamp)
- **What** changed (field-level before/after diffs)
- **Action type:** `created`, `updated`, `restored`

**Change Display Types:**

| Field Type | Display Format |
|------------|---------------|
| Text | Truncated old → new string |
| Boolean | "Active" ↔ "Inactive" |
| Select | Raw value or "None" |
| Image | "Custom image" / "No image" |
| Array | Comma-separated list with count |
| JSON | Summary string (e.g., "28 variants, 477 total") |

**Activity Viewer:** The product/category edit page shows up to 25 recent activity entries in an expandable section. Each `updated` entry has a "Restore to this state" button.

#### Undo System

- **Session-based:** Before each save, the current model state is stored in the PHP session
- **Floating Undo Button:** Appears at the top of the edit page after a change is saved
- **Confirmation Dialog:** Clicking undo shows a confirmation before reverting
- **Restore from Activity:** Any historical `updated` entry can be restored, reverting all fields to their previous values
- **Undo Logging:** Restorations are themselves logged as `restored` activities (prevents restore loops)
- **Chainable:** After a restore, a new undo state is saved so the restore itself can be undone

---

## 5. Localization (i18n)

The entire application supports **English** and **Arabic** with full RTL (right-to-left) layout support.

### Translation Structure

```
resources/js/locales/
├── en/
│   ├── common.json     — Shared UI strings (cart, wishlist, buttons, footer)
│   ├── shop.json       — Shop-specific (filters, sorting, product details)
│   ├── nav.json        — Navigation labels
│   ├── checkout.json   — Checkout flow
│   ├── profile.json    — Profile & account
│   └── auth.json       — Login, register, verification
└── ar/
    ├── common.json
    ├── shop.json
    ├── nav.json
    ├── checkout.json
    ├── profile.json
    └── auth.json
```

### Translation Patterns

**Namespaced access:**
```typescript
t('common:cart.title')          // "Cart" / "السلة"
t('shop:filters')               // "Filters" / "الفلاتر"
t('shop:sortOptions.newest')    // "Newest" / "الأحدث"
```

**Interpolation:**
```typescript
t('shop:showingResults', { from: 1, to: 10, total: 100 })
// "Showing 1–10 of 100 results" / "عرض ١–١٠ من ١٠٠ نتيجة"
```

### Arabic Numeral Support

All numbers displayed to the user are formatted using Arabic-Indic numerals when the language is Arabic:

```typescript
formatNumber(25, 'ar')    // "٢٥"
formatNumber(25, 'en')    // "25"
formatPrice(49.99, 'ar')  // "٤٩.٩٩ دينار"
formatPrice(49.99, 'en')  // "49.99 JOD"
```

### RTL Layout Handling

- **Global direction:** The `<html>` element receives `dir="rtl"` when Arabic is selected
- **Tailwind RTL:** Uses `rtl:` prefix for direction-specific styles
- **Scroll arrows:** Arrow button icons stay consistent, but scroll direction swaps
- **Password fields:** Use inline `style={{ direction: 'rtl', textAlign: 'right' }}` instead of `dir` attribute
- **Email fields:** Stay LTR even in Arabic mode (emails are always left-to-right)
- **Phone numbers:** Use `dir="ltr"` to prevent digit reversal
- **Padding swaps:** Toggle button positions and padding for eye icons, search icons, etc.

### Bilingual Product Content

Products store both English and Arabic versions:
- `name` / `name_ar`
- `description` / `description_ar`
- `short_description` / `short_description_ar`

The `useLocalized()` hook automatically selects the correct version:
```typescript
const { getProductName, getCategoryName } = useLocalized();
getProductName(product)    // Returns name_ar if Arabic, else name
getCategoryName(category)  // Returns name_ar if Arabic, else name
```

---

## 6. Performance & Optimization

### Progressive Loading (Inertia Deferred Props)

Heavy data is loaded asynchronously using `Inertia::defer()`. The page shell renders immediately with skeleton placeholders, and data fills in as it arrives.

| Page | Immediate Props | Deferred Props |
|------|----------------|----------------|
| **Home** | categories | featuredCategories, saleProducts |
| **Category** | category, subcategories, filters, sort | products, priceRange, productsWithColors, productsWithSizes, maxDiscount, availableDiscountBrackets |
| **Product** | product, breadcrumbs | reviews, ratingDistribution, relatedProducts, canReview, userReview |
| **Dashboard** | stats, orders | revenueChart, recentReviews |

### Database Indexes

Targeted composite indexes on the `products` table for the most common query patterns:

| Index | Columns | Query Type |
|-------|---------|------------|
| `products_category_price_idx` | category_id, is_active, price | Price range (MIN/MAX) |
| `products_category_discount_idx` | category_id, is_active, compare_price, price | Discount calculations |
| `products_category_color_idx` | category_id, is_active, color | Color filter queries |
| `products_category_active_idx` | category_id, is_active | General category filtering |
| `products_active_sale_idx` | is_active, compare_price | Sale products |
| `products_active_popular_idx` | is_active, times_purchased | Popular sorting |
| `products_active_newest_idx` | is_active, created_at | Newest sorting |
| `products_active_price_idx` | is_active, price | Price filtering |

### Query Caching (Redis)

Filter metadata is cached for 10 minutes to avoid redundant database queries:

| Cached Data | Cache Key Pattern | TTL |
|-------------|-------------------|-----|
| Price range per category | `category_price_range_{ids}` | 10 min |
| Products with colors | `category_products_with_colors_{ids}` | 10 min |
| Products with sizes | `category_products_with_sizes_{ids}` | 10 min |
| Max discount | `category_max_discount_{ids}` | 10 min |
| Discount brackets | `category_discount_brackets_{ids}` | 10 min |

### Other Optimizations

- **Lazy image loading:** All product images use `loading="lazy"` for native browser lazy loading
- **Debounced cart updates:** Quantity changes debounced at 300ms to prevent excessive requests
- **Selective SPA navigation:** Category-to-category navigation fetches only changed props via `only` option
- **Query limits:** Homepage fetches only 8 products per category, not all products
- **Chart lazy loading:** Recharts library is dynamically imported with `React.lazy()` to avoid bundling ~150KB globally
- **Dashboard polling:** 30-second auto-refresh for real-time stats without manual reload
- **View count deduplication:** Session keys prevent Inertia deferred requests from inflating page view counts

---

## 7. Security

### Authentication & Authorization

| Mechanism | Implementation |
|-----------|---------------|
| **Session Auth** | Laravel Sanctum with encrypted session cookies |
| **CSRF Protection** | Inertia v2 cookie-based (no meta tag) — Axios sends XSRF-TOKEN header automatically |
| **Admin Guard** | `admin` middleware checks `user->role === 'admin'` on all `/admin/*` routes |
| **Email Verification** | Signed URL tokens, rate-limited resend (6/min) |
| **OAuth** | Google sign-in via Laravel Socialite with race condition protection (`lockForUpdate`) |
| **Password Hashing** | Bcrypt via Laravel's `Hash` facade |

### Data Protection

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | All raw queries use parameterized placeholders (`?`) — never string interpolation |
| **XSS** | React's JSX auto-escapes output; no `dangerouslySetInnerHTML` |
| **CSRF** | Inertia v2 XSRF-TOKEN cookie + X-XSRF-TOKEN header on every request |
| **Mass Assignment** | Laravel's `$fillable` / `$guarded` on all models |
| **Race Conditions** | Optimistic locking on product edits (`loaded_at` timestamp comparison) |
| **Credential Exposure** | Demo credentials only in seeder, not in public README |

### Optimistic Locking (Concurrent Edit Protection)

When two admins edit the same product simultaneously:

1. Page loads → `product.updated_at` is captured as `loaded_at`
2. Admin A saves → product updates, `updated_at` changes
3. Admin B saves → `loaded_at` ≠ current `updated_at` → **409 Conflict** error
4. Admin B sees a toast notification: "This product was modified while you were editing it. Please refresh."
5. Clicking "Refresh page" reloads with the latest data

---

## 8. Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Customer and admin accounts | name, email, phone, avatar, role, email_verified_at, verified_via |
| `products` | Product catalog | name, name_ar, slug, price, compare_price, sku, stock, category_id, color, color_hex, available_sizes (JSON), size_stock (JSON), variant_stock (JSON), is_active, is_featured, times_purchased, average_rating, rating_count, view_count |
| `categories` | Hierarchical categories | name, name_ar, slug, parent_id, image, sort_order, is_active, low_stock_threshold |
| `product_images` | Multiple images per product | product_id, path, sort_order, is_primary, color |
| `carts` | Shopping carts | user_id, session_id |
| `cart_items` | Items in carts | cart_id, product_id, quantity, color, color_hex, size, selected_image_id |
| `orders` | Customer orders | user_id, coupon_id, order_number, status, payment_method, payment_status, subtotal, tax, shipping_fee, discount, total, shipping_address (JSON), billing_address (JSON), tracking_number, carrier |
| `order_items` | Items in orders | order_id, product_id, product_name, product_sku, price, quantity, subtotal |
| `order_activities` | Order event timeline | order_id, action, notes, created_by |
| `reviews` | Product reviews | product_id, user_id, rating, title, title_ar, comment, comment_ar, is_verified_purchase, helpful_count, language |
| `review_helpful_votes` | Helpful vote tracking | review_id, user_id |
| `coupons` | Discount coupons | code, name, name_ar, type, value, min_order_amount, max_discount, usage_limit, usage_count, per_user_limit, starts_at, expires_at, is_active |
| `coupon_user` | Per-user coupon usage pivot | coupon_id, user_id, used_at |
| `activity_logs` | Admin edit audit trail | model_type, model_id, model_name, action, changes (JSON), user_id |
| `settings` | Site configuration | key-value store for store name, email, currency, thresholds |
| `sessions` | Session storage | id, user_id, ip_address, user_agent, payload, last_activity |

### Relationships

```
User ──┬── hasMany ── Order ── hasMany ── OrderItem
       ├── hasOne ─── Cart ─── hasMany ── CartItem
       ├── hasMany ── Review ─ belongsTo ─ Product
       └── belongsToMany ──── Coupon (via coupon_user)

Category ──┬── hasMany ── Product ── hasMany ── ProductImage
           └── hasMany ── Category (self-referencing: parent/children)

Product ──┬── belongsTo ── Category
          ├── hasMany ─── ProductImage
          ├── hasMany ─── Review
          ├── hasMany ─── CartItem
          └── hasMany ─── OrderItem

Order ──┬── belongsTo ── User
        ├── belongsTo ── Coupon
        ├── hasMany ─── OrderItem
        └── hasMany ─── OrderActivity
```

---

## 9. Deployment

### Railway Configuration

| Setting | Value |
|---------|-------|
| **Platform** | Railway (cloud PaaS) |
| **Region** | EU West (Amsterdam) |
| **Pre-deploy Command** | `php artisan migrate --force && php artisan storage:link` |
| **Start Command** | `php artisan serve --host=0.0.0.0 --port=$PORT` |
| **Production URL** | `https://demo.hardrock-co.com` |

### Architecture on Railway

```
Railway Project
├── Laravel App (Web Server)
├── MySQL Service (Database)
└── Redis Service (Cache + Sessions)
```

### Environment Variables

| Variable | Production Value |
|----------|-----------------|
| `APP_ENV` | production |
| `APP_DEBUG` | false |
| `APP_URL` | https://demo.hardrock-co.com |
| `DB_CONNECTION` | mysql |
| `SESSION_DRIVER` | database |
| `CACHE_DRIVER` | redis |
| `REDIS_*` | Railway Redis connection vars |
| `DB_*` | Railway MySQL connection vars |

### One-Time Seeding

To seed data in production:
1. Temporarily add `&& php artisan db:seed --class=SeederName --force` to the pre-deploy command
2. Deploy
3. Revert the pre-deploy command to the standard migration-only version

---

## 10. Project Structure

```
hardrock-ecom-demo/
├── app/
│   ├── Models/                     # 15 Eloquent models
│   │   ├── User.php
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── OrderActivity.php
│   │   ├── Cart.php
│   │   ├── CartItem.php
│   │   ├── Review.php
│   │   ├── ReviewHelpfulVote.php
│   │   ├── Coupon.php
│   │   ├── ProductImage.php
│   │   ├── ActivityLog.php
│   │   └── Setting.php
│   ├── Services/                   # Business logic services
│   │   ├── CartService.php         # Cart CRUD + guest-user merge
│   │   ├── CheckoutService.php     # Order creation + stock + coupons
│   │   ├── ActivityLogService.php  # Audit trail persistence
│   │   └── UndoService.php         # Session-based undo state
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Shop/               # Customer-facing controllers
│   │   │   │   ├── HomeController.php
│   │   │   │   ├── LandingController.php  # Category pages
│   │   │   │   ├── ProductController.php
│   │   │   │   ├── CartController.php
│   │   │   │   ├── CheckoutController.php
│   │   │   │   ├── OrderController.php
│   │   │   │   ├── ReviewController.php
│   │   │   │   ├── ProfileController.php
│   │   │   │   └── CouponController.php
│   │   │   └── Admin/              # Admin controllers
│   │   │       ├── DashboardController.php
│   │   │       ├── ProductController.php
│   │   │       ├── CategoryController.php
│   │   │       ├── OrderController.php
│   │   │       ├── UserController.php
│   │   │       ├── ReviewController.php
│   │   │       ├── CouponController.php
│   │   │       ├── ReportsController.php
│   │   │       ├── SettingsController.php
│   │   │       ├── SearchController.php
│   │   │       └── UndoController.php
│   │   └── Requests/              # Form request validation
│   └── Providers/
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Shop/              # 9 customer pages
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Category.tsx
│   │   │   │   ├── Product.tsx
│   │   │   │   ├── Cart.tsx
│   │   │   │   ├── Checkout.tsx
│   │   │   │   ├── OrderConfirmation.tsx
│   │   │   │   ├── OrderHistory.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── Search.tsx
│   │   │   ├── Auth/              # 6 auth pages
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   ├── ResetPassword.tsx
│   │   │   │   ├── VerifyEmail.tsx
│   │   │   │   └── ConfirmPassword.tsx
│   │   │   └── Admin/             # Admin pages
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Products/      (Index, Create, Edit)
│   │   │       ├── Categories/    (Index, Create, Edit, Show)
│   │   │       ├── Orders/        (Index, Show, Invoice)
│   │   │       ├── Users/         (Index, Edit, Show)
│   │   │       ├── Reviews/       (Index, Show)
│   │   │       ├── Coupons/       (Index, Create, Edit)
│   │   │       ├── Reports/       (Index)
│   │   │       └── Settings/      (Index)
│   │   ├── Components/
│   │   │   ├── shop/              # Customer UI components
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── ProductGridSkeleton.tsx
│   │   │   │   ├── HeroBanner.tsx
│   │   │   │   ├── CategoryNav.tsx
│   │   │   │   ├── FeaturedCategorySection.tsx
│   │   │   │   ├── CartDrawer.tsx
│   │   │   │   ├── CartItem.tsx
│   │   │   │   ├── WishlistDrawer.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── admin/             # Admin UI components
│   │   │   │   ├── UndoButton.tsx
│   │   │   │   └── NumberInput.tsx
│   │   │   └── ui/               # Shared UI primitives
│   │   │       ├── DualRangeSlider.tsx
│   │   │       └── Badge.tsx
│   │   ├── Layouts/
│   │   │   ├── ShopLayout.tsx     # Customer layout (header, footer, nav)
│   │   │   └── AdminLayout.tsx    # Admin layout
│   │   ├── contexts/              # React contexts
│   │   │   ├── CartContext.tsx
│   │   │   └── WishlistContext.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   │   └── useLocalized.ts
│   │   ├── lib/                   # Utility functions
│   │   │   └── utils.ts           # formatPrice, formatNumber, getImageUrl, etc.
│   │   └── locales/               # Translation files
│   │       ├── en/                (common, shop, nav, checkout, profile, auth)
│   │       └── ar/                (common, shop, nav, checkout, profile, auth)
│   └── views/
│       └── app.blade.php          # Inertia root template
├── database/
│   ├── migrations/                # 20+ migration files
│   └── seeders/                   # 13 seeders for demo data
├── routes/
│   ├── web.php                    # Shop & auth routes
│   └── admin.php                  # Admin routes (auth + admin middleware)
├── public/
│   └── images/                    # Static assets
│       ├── products/              # Product images (seeded)
│       ├── banners/               # Hero & category banners
│       └── home_mini/             # Category nav thumbnails
├── storage/app/public/            # User uploads (avatars, admin-uploaded images)
├── composer.json                  # PHP dependencies
├── package.json                   # Node dependencies
├── vite.config.ts                 # Vite bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── CLAUDE.md                      # AI assistant context document
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hardrock-demo.com | demo1234 |
| Customer | customer@hardrock-demo.com | demo1234 |

---

*This documentation covers the complete HardRock E-Commerce platform as of February 2026.*
