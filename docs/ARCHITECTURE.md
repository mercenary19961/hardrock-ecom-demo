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
├── components/
│   ├── ui/                           # Base primitives (buttons, inputs, cards)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   └── index.ts
│   ├── shop/                         # Shop-specific components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryNav.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── QuantitySelector.tsx
│   │   ├── SearchBar.tsx
│   │   └── ImageGallery.tsx
│   └── admin/                        # Admin-specific components
│       ├── DataTable.tsx
│       ├── StatsCard.tsx
│       ├── ImageUploader.tsx
│       ├── OrderStatusBadge.tsx
│       └── Sidebar.tsx
├── layouts/
│   ├── ShopLayout.tsx                # Customer-facing layout
│   ├── AdminLayout.tsx               # Admin panel layout
│   └── AuthLayout.tsx                # Login/register layout
├── pages/
│   ├── Shop/
│   │   ├── Home.tsx                  # Landing page
│   │   ├── Category.tsx              # Category listing
│   │   ├── Product.tsx               # Product detail
│   │   ├── Search.tsx                # Search results
│   │   ├── Cart.tsx                  # Cart page
│   │   ├── Checkout.tsx              # Checkout flow
│   │   ├── OrderConfirmation.tsx     # Order success
│   │   └── OrderHistory.tsx          # Past orders
│   ├── Admin/
│   │   ├── Dashboard.tsx
│   │   ├── Categories/
│   │   │   ├── Index.tsx
│   │   │   ├── Create.tsx
│   │   │   └── Edit.tsx
│   │   ├── Products/
│   │   │   ├── Index.tsx
│   │   │   ├── Create.tsx
│   │   │   └── Edit.tsx
│   │   └── Orders/
│   │       ├── Index.tsx
│   │       └── Show.tsx
│   └── Auth/
│       ├── Login.tsx
│       ├── Register.tsx
│       └── ForgotPassword.tsx
├── hooks/
│   ├── useCart.ts                    # Cart state management
│   ├── useToast.ts                   # Toast notifications
│   └── useDebounce.ts                # Search debouncing
├── contexts/
│   └── CartContext.tsx               # Global cart state
├── lib/
│   ├── utils.ts                      # Utility functions
│   ├── formatters.ts                 # Price/date formatting
│   └── validators.ts                 # Client-side validation
└── types/
    ├── index.d.ts                    # Global types
    ├── models.ts                     # Data model types
    └── inertia.d.ts                  # Inertia page props
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
- **Cart state**: React Context + localStorage (guest) / database (authenticated)
- **UI state**: Local component state (modals, dropdowns)

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
