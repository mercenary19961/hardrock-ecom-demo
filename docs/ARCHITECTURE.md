# Architecture Overview

## Stack Summary

This project follows the same architecture as the main HardRock website:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare (DNS + CDN)                       │
│                    demo.hardrock-co.com                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Railway Platform                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Laravel Application                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Routes    │→ │ Controllers │→ │    Services     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                │                  │             │  │
│  │         ▼                ▼                  ▼             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │  Inertia    │← │   Models    │← │    Database     │   │  │
│  │  │  Response   │  │  (Eloquent) │  │    (MySQL)      │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                                                 │  │
│  │         ▼                                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              React + TypeScript SPA                  │ │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │ │  │
│  │  │  │  Pages  │  │Components│  │ Contexts│  │  Hooks │ │ │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Architecture

### Backend (Laravel)

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/                    # Admin panel
│   │   │   ├── DashboardController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── ProductController.php
│   │   │   ├── OrderController.php
│   │   │   └── InventoryController.php
│   │   ├── Shop/                     # Customer storefront
│   │   │   ├── HomeController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CartController.php
│   │   │   ├── CheckoutController.php
│   │   │   └── OrderController.php
│   │   └── Auth/                     # Authentication
│   │       └── (Laravel Breeze defaults)
│   ├── Middleware/
│   │   ├── AdminMiddleware.php       # Admin role check
│   │   └── HandleInertiaRequests.php
│   └── Requests/                     # Form validation
│       ├── Admin/
│       │   ├── StoreCategoryRequest.php
│       │   ├── StoreProductRequest.php
│       │   └── UpdateOrderRequest.php
│       └── Shop/
│           ├── AddToCartRequest.php
│           └── CheckoutRequest.php
├── Models/
│   ├── User.php
│   ├── Category.php
│   ├── Product.php
│   ├── ProductImage.php
│   ├── Cart.php
│   ├── CartItem.php
│   ├── Order.php
│   └── OrderItem.php
└── Services/
    ├── CartService.php               # Cart business logic
    ├── CheckoutService.php           # Order processing
    ├── InventoryService.php          # Stock management
    └── ImageService.php              # Image upload/resize
```

### Frontend (React + TypeScript)

```
resources/js/
├── app.tsx                           # Application entry
├── bootstrap.ts                      # Axios, global setup
├── Components/
│   ├── ui/                           # Base primitives (buttons, inputs, cards)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── DualRangeSlider.tsx       # Price range filter
│   │   └── index.ts
│   ├── shop/                         # Shop-specific components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryNav.tsx           # Glassmorphism category icons
│   │   ├── HeroBanner.tsx            # Homepage hero carousel
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   ├── WishlistDrawer.tsx
│   │   ├── SearchBar.tsx
│   │   └── FeaturedCategorySection.tsx
│   └── admin/                        # Admin-specific components
│       ├── DataTable.tsx
│       ├── StatsCard.tsx
│       └── ImageUploader.tsx
├── Layouts/
│   ├── ShopLayout.tsx                # Customer layout (header, nav, footer)
│   ├── AdminLayout.tsx               # Admin panel layout
│   └── AuthenticatedLayout.tsx       # Auth layout
├── Pages/
│   ├── Shop/
│   │   ├── Home.tsx                  # Landing page
│   │   ├── Category.tsx              # Category with filters
│   │   ├── Product.tsx               # Product detail
│   │   ├── Search.tsx                # Search results
│   │   ├── Cart.tsx                  # Cart page
│   │   └── Checkout.tsx              # Checkout flow
│   ├── Admin/
│   │   ├── Dashboard.tsx
│   │   ├── Categories/
│   │   ├── Products/
│   │   └── Orders/
│   └── Auth/
│       ├── Login.tsx
│       └── Register.tsx
├── hooks/
│   ├── useLocalized.ts               # Bilingual content helper
│   └── useDebounce.ts                # Search debouncing
├── contexts/
│   ├── CartContext.tsx               # Global cart state
│   ├── WishlistContext.tsx           # Wishlist state
│   └── LanguageContext.tsx           # i18n language state
├── locales/                          # Translation files
│   ├── en/
│   │   ├── common.json
│   │   ├── shop.json
│   │   └── nav.json
│   └── ar/
│       ├── common.json
│       ├── shop.json
│       └── nav.json
├── lib/
│   └── utils.ts                      # Utility functions (formatPrice, formatNumber)
└── types/
    └── models.ts                     # Data model types
```

---

## Key Patterns

### 1. Inertia.js Data Flow

```
Laravel Controller              Inertia               React Page
      │                            │                      │
      │  return Inertia::render(   │                      │
      │    'Shop/Product',         │                      │
      │    ['product' => $product] │                      │
      │  );                        │                      │
      │ ───────────────────────────▶                      │
      │                            │  Page Props          │
      │                            │ ─────────────────────▶
      │                            │                      │
      │                            │   <Product           │
      │                            │     product={product}│
      │                            │   />                 │
```

### 2. Controller Organization

- **Admin controllers**: Full CRUD, protected by admin middleware
- **Shop controllers**: Read-heavy, cart/checkout actions
- **Services**: Business logic extracted from controllers

### 3. Component Hierarchy

```
ShopLayout
├── Header (logo, nav, cart icon)
├── {children} (page content)
└── Footer

AdminLayout
├── Sidebar (navigation)
├── Header (user menu)
└── Main content area
```

### 4. State Management

- **Server state**: Inertia handles all data fetching
- **Cart state**: React Context + database (CartContext.tsx)
- **Wishlist state**: React Context + localStorage (WishlistContext.tsx)
- **Language state**: React Context + i18next (LanguageContext.tsx)
- **UI state**: Local component state (modals, drawers, filters)

### 5. Localization (i18n)

- **Languages**: English (default), Arabic (RTL)
- **Translation files**: `resources/js/locales/{en,ar}/*.json`
- **Bilingual content**: Products, categories have `name` and `name_ar` fields
- **Utility hook**: `useLocalized()` returns `getProductName()`, `getCategoryName()`

---

## Database Relationships

```
User
├── hasMany: Orders
├── hasOne: Cart
└── role: 'admin' | 'customer'

Category
├── hasMany: Products
└── parent_id: self-referential (subcategories)

Product
├── belongsTo: Category
├── hasMany: ProductImages
├── hasMany: CartItems
└── hasMany: OrderItems

Cart
├── belongsTo: User (nullable for guests)
└── hasMany: CartItems

Order
├── belongsTo: User
├── hasMany: OrderItems
└── status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
```

---

## Security Considerations

1. **Authentication**: Laravel Breeze with session-based auth
2. **Authorization**: Admin middleware for `/admin/*` routes
3. **CSRF**: Automatic via Laravel/Inertia
4. **Validation**: Server-side Form Requests, client-side for UX
5. **File uploads**: Validated mime types, size limits, stored outside webroot
6. **SQL injection**: Eloquent ORM prevents by default
