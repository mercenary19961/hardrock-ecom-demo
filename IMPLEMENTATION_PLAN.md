# Implementation Plan

## Step-by-Step Build Order

This document outlines the exact sequence of steps to build the HardRock E-commerce Demo from scratch.

---

## Phase 1: Project Setup

### Step 1.1: Initialize Laravel Project
```bash
composer create-project laravel/laravel . --prefer-dist
```

### Step 1.2: Install Core Dependencies
```bash
# PHP dependencies
composer require inertiajs/inertia-laravel
composer require laravel/breeze --dev

# Install Breeze with React + TypeScript + Inertia
php artisan breeze:install react --typescript --inertia

# Additional PHP packages
composer require intervention/image  # Image processing
```

### Step 1.3: Install Frontend Dependencies
```bash
npm install
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install framer-motion
npm install clsx tailwind-merge
npm install -D @types/node
```

### Step 1.4: Configure Environment
- Copy `.env.example` to `.env`
- Set `APP_KEY` via `php artisan key:generate`
- Configure database credentials
- Run `php artisan storage:link`

---

## Phase 2: Database Layer

### Step 2.1: Create Migrations

**Order of migrations** (dependencies matter):

1. `create_categories_table` - Base table
2. `create_products_table` - References categories
3. `create_product_images_table` - References products
4. `create_carts_table` - References users
5. `create_cart_items_table` - References carts, products
6. `create_orders_table` - References users
7. `create_order_items_table` - References orders, products
8. `add_role_to_users_table` - Modify existing users table

```bash
php artisan make:migration create_categories_table
php artisan make:migration create_products_table
php artisan make:migration create_product_images_table
php artisan make:migration create_carts_table
php artisan make:migration create_cart_items_table
php artisan make:migration create_orders_table
php artisan make:migration create_order_items_table
php artisan make:migration add_role_to_users_table
```

### Step 2.2: Create Models

```bash
php artisan make:model Category
php artisan make:model Product
php artisan make:model ProductImage
php artisan make:model Cart
php artisan make:model CartItem
php artisan make:model Order
php artisan make:model OrderItem
```

Define relationships in each model (see docs/DATABASE.md).

### Step 2.3: Create Factories & Seeders

```bash
php artisan make:factory CategoryFactory
php artisan make:factory ProductFactory
php artisan make:factory ProductImageFactory

php artisan make:seeder CategorySeeder
php artisan make:seeder ProductSeeder
php artisan make:seeder UserSeeder
php artisan make:seeder DemoSeeder  # Master seeder
```

### Step 2.4: Run Migrations & Seed

```bash
php artisan migrate
php artisan db:seed
```

---

## Phase 3: Backend - Shop Module

### Step 3.1: Create Shop Controllers

```bash
php artisan make:controller Shop/HomeController
php artisan make:controller Shop/CategoryController
php artisan make:controller Shop/ProductController
php artisan make:controller Shop/CartController
php artisan make:controller Shop/CheckoutController
php artisan make:controller Shop/OrderController
```

### Step 3.2: Create Services

```bash
mkdir app/Services
# Create manually:
# - CartService.php
# - CheckoutService.php
# - InventoryService.php
```

### Step 3.3: Create Form Requests

```bash
php artisan make:request Shop/AddToCartRequest
php artisan make:request Shop/UpdateCartRequest
php artisan make:request Shop/CheckoutRequest
```

### Step 3.4: Define Routes

In `routes/web.php`:
```php
// Shop routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/category/{slug}', [CategoryController::class, 'show'])->name('category.show');
Route::get('/product/{slug}', [ProductController::class, 'show'])->name('product.show');
Route::get('/search', [ProductController::class, 'search'])->name('search');

// Cart routes
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{item}', [CartController::class, 'remove'])->name('cart.remove');

// Checkout routes
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/order/confirmation/{order}', [OrderController::class, 'confirmation'])->name('order.confirmation');

// Order history (authenticated)
Route::middleware('auth')->group(function () {
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
});
```

---

## Phase 4: Backend - Admin Module

### Step 4.1: Create Admin Middleware

```bash
php artisan make:middleware AdminMiddleware
```

Register in `bootstrap/app.php`.

### Step 4.2: Create Admin Controllers

```bash
php artisan make:controller Admin/DashboardController
php artisan make:controller Admin/CategoryController --resource
php artisan make:controller Admin/ProductController --resource
php artisan make:controller Admin/OrderController
```

### Step 4.3: Create Admin Form Requests

```bash
php artisan make:request Admin/StoreCategoryRequest
php artisan make:request Admin/UpdateCategoryRequest
php artisan make:request Admin/StoreProductRequest
php artisan make:request Admin/UpdateProductRequest
php artisan make:request Admin/UpdateOrderRequest
```

### Step 4.4: Define Admin Routes

Create `routes/admin.php`:
```php
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
});
```

---

## Phase 5: Frontend - Foundation

### Step 5.1: Create Directory Structure

```
resources/js/
├── components/
│   ├── ui/
│   ├── shop/
│   └── admin/
├── layouts/
├── pages/
│   ├── Shop/
│   ├── Admin/
│   └── Auth/
├── hooks/
├── contexts/
├── lib/
└── types/
```

### Step 5.2: Create Base UI Components

Build these first (in `components/ui/`):
1. Button.tsx
2. Input.tsx
3. Card.tsx
4. Badge.tsx
5. Modal.tsx
6. Toast.tsx (with context)
7. Skeleton.tsx

### Step 5.3: Create Layouts

1. ShopLayout.tsx - Header, footer, cart drawer
2. AdminLayout.tsx - Sidebar, top bar
3. AuthLayout.tsx - Centered card layout

### Step 5.4: Create TypeScript Types

In `types/models.ts`:
```typescript
export interface Category { ... }
export interface Product { ... }
export interface CartItem { ... }
export interface Order { ... }
// etc.
```

---

## Phase 6: Frontend - Shop Pages

### Step 6.1: Core Shop Components

Build in `components/shop/`:
1. ProductCard.tsx
2. ProductGrid.tsx
3. CategoryNav.tsx
4. SearchBar.tsx
5. PriceDisplay.tsx

### Step 6.2: Cart Components

1. CartDrawer.tsx
2. CartItem.tsx
3. QuantitySelector.tsx
4. CartContext.tsx (in contexts/)

### Step 6.3: Shop Pages

Build in order:
1. `pages/Shop/Home.tsx` - Featured products, categories
2. `pages/Shop/Category.tsx` - Product listing with filters
3. `pages/Shop/Product.tsx` - Detail page with gallery
4. `pages/Shop/Search.tsx` - Search results
5. `pages/Shop/Cart.tsx` - Full cart page
6. `pages/Shop/Checkout.tsx` - Checkout form
7. `pages/Shop/OrderConfirmation.tsx` - Success page
8. `pages/Shop/OrderHistory.tsx` - Past orders

---

## Phase 7: Frontend - Admin Pages

### Step 7.1: Admin Components

Build in `components/admin/`:
1. Sidebar.tsx
2. StatsCard.tsx
3. DataTable.tsx
4. ImageUploader.tsx
5. OrderStatusBadge.tsx

### Step 7.2: Admin Pages

Build in order:
1. `pages/Admin/Dashboard.tsx` - Stats overview
2. `pages/Admin/Categories/Index.tsx` - Category list
3. `pages/Admin/Categories/Create.tsx` - Category form
4. `pages/Admin/Categories/Edit.tsx` - Category edit
5. `pages/Admin/Products/Index.tsx` - Product list
6. `pages/Admin/Products/Create.tsx` - Product form
7. `pages/Admin/Products/Edit.tsx` - Product edit
8. `pages/Admin/Orders/Index.tsx` - Order list
9. `pages/Admin/Orders/Show.tsx` - Order detail

---

## Phase 8: Demo Data & Polish

### Step 8.1: Seed Realistic Data

- 6 categories with images
- 30 products with multiple images
- Sample orders in various statuses
- Demo user accounts

### Step 8.2: Add Product Images

Either:
- Use placeholder service (picsum.photos, unsplash)
- Add curated royalty-free images to `storage/app/public/products/`

### Step 8.3: Polish & Testing

- Test all user flows
- Check responsive design
- Fix edge cases (empty cart, out of stock, etc.)
- Add loading states
- Add error handling

---

## Phase 9: Deployment

### Step 9.1: Prepare for Production

```bash
# Build assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 9.2: Deploy to Railway

Follow `docs/DEPLOYMENT.md`:
1. Create Railway project
2. Add MySQL database
3. Configure environment variables
4. Add custom domain

### Step 9.3: Configure Cloudflare DNS

1. Add CNAME record: `demo` → Railway target
2. Wait for SSL provisioning
3. Verify site works

### Step 9.4: Final Verification

- [ ] https://demo.hardrock-co.com loads
- [ ] All pages work
- [ ] Admin login works
- [ ] Cart/checkout flow works
- [ ] Main site unaffected

---

## Estimated Module Breakdown

| Module | Files | Complexity |
|--------|-------|------------|
| Database (migrations, models, seeders) | ~20 | Medium |
| Shop Backend (controllers, services, routes) | ~15 | Medium |
| Admin Backend (controllers, requests, routes) | ~15 | Medium |
| UI Components | ~15 | Low-Medium |
| Shop Frontend (pages, components) | ~20 | Medium |
| Admin Frontend (pages, components) | ~15 | Medium |
| Configuration & Polish | ~10 | Low |
| **Total** | **~110 files** | |

---

## Quick Reference: Commands

```bash
# Development
php artisan serve           # Start Laravel
npm run dev                 # Start Vite

# Database
php artisan migrate         # Run migrations
php artisan migrate:fresh --seed  # Reset & seed
php artisan db:seed         # Seed only

# Generation
php artisan make:controller Name
php artisan make:model Name -mf  # With migration & factory
php artisan make:request Name

# Production
npm run build
php artisan optimize        # Cache everything
```
