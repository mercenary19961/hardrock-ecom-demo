# Database Schema

**[View Interactive Diagram on DrawSQL](https://drawsql.app/teams/hardrock/diagrams/hardrock-e-commerce-demo)**

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │  categories  │       │   products   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ name         │       │ name         │◄──────│ category_id  │
│ email        │       │ slug         │       │ name         │
│ password     │       │ description  │       │ slug         │
│ role         │       │ image        │       │ description  │
│ created_at   │       │ parent_id    │───┐   │ price        │
│ updated_at   │       │ sort_order   │   │   │ compare_price│
└──────┬───────┘       │ is_active    │   │   │ sku          │
       │               │ created_at   │◄──┘   │ stock        │
       │               │ updated_at   │       │ is_active    │
       │               └──────────────┘       │ is_featured  │
       │                                      │ created_at   │
       │                                      │ updated_at   │
       │                                      └──────┬───────┘
       │                                             │
       │               ┌──────────────┐              │
       │               │product_images│              │
       │               ├──────────────┤              │
       │               │ id           │              │
       │               │ product_id   │◄─────────────┤
       │               │ path         │              │
       │               │ alt_text     │              │
       │               │ sort_order   │              │
       │               │ is_primary   │              │
       │               │ created_at   │              │
       │               │ updated_at   │              │
       │               └──────────────┘              │
       │                                             │
       │               ┌──────────────┐              │
       │               │    carts     │              │
       │               ├──────────────┤              │
       │               │ id           │              │
       ├──────────────►│ user_id      │              │
       │               │ session_id   │              │
       │               │ created_at   │              │
       │               │ updated_at   │              │
       │               └──────┬───────┘              │
       │                      │                      │
       │               ┌──────▼───────┐              │
       │               │  cart_items  │              │
       │               ├──────────────┤              │
       │               │ id           │              │
       │               │ cart_id      │              │
       │               │ product_id   │◄─────────────┤
       │               │ quantity     │              │
       │               │ created_at   │              │
       │               │ updated_at   │              │
       │               └──────────────┘              │
       │                                             │
       │               ┌──────────────┐              │
       │               │    orders    │              │
       │               ├──────────────┤              │
       ├──────────────►│ id           │              │
       │               │ user_id      │              │
       │               │ order_number │              │
       │               │ status       │              │
       │               │ subtotal     │              │
       │               │ tax          │              │
       │               │ total        │              │
       │               │ customer_name│              │
       │               │ customer_email              │
       │               │ shipping_addr│              │
       │               │ billing_addr │              │
       │               │ notes        │              │
       │               │ created_at   │              │
       │               │ updated_at   │              │
       │               └──────┬───────┘              │
       │                      │                      │
       │               ┌──────▼───────┐              │
       │               │ order_items  │              │
       │               ├──────────────┤              │
       │               │ id           │              │
       │               │ order_id     │              │
       │               │ product_id   │◄─────────────┘
       │               │ product_name │ (snapshot)
       │               │ product_sku  │ (snapshot)
       │               │ price        │ (snapshot)
       │               │ quantity     │
       │               │ subtotal     │
       │               │ created_at   │
       │               │ updated_at   │
       │               └──────────────┘
```

---

## Table Definitions

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| email_verified_at | TIMESTAMP | NULLABLE | Email verification |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| role | ENUM('admin','customer') | DEFAULT 'customer' | User role |
| remember_token | VARCHAR(100) | NULLABLE | Session token |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

### categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| name | VARCHAR(255) | NOT NULL | Display name (English) |
| name_ar | VARCHAR(255) | NULLABLE | Display name (Arabic) |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL slug |
| description | TEXT | NULLABLE | Category description (English) |
| description_ar | TEXT | NULLABLE | Category description (Arabic) |
| image | VARCHAR(255) | NULLABLE | Category image path |
| parent_id | BIGINT | FK→categories, NULLABLE | Parent category |
| sort_order | INT | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT true | Visibility |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

### products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| category_id | BIGINT | FK→categories, NOT NULL | Parent category |
| name | VARCHAR(255) | NOT NULL | Product name (English) |
| name_ar | VARCHAR(255) | NULLABLE | Product name (Arabic) |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL slug |
| description | TEXT | NULLABLE | Full description (English) |
| description_ar | TEXT | NULLABLE | Full description (Arabic) |
| short_description | VARCHAR(500) | NULLABLE | Card description (English) |
| short_description_ar | VARCHAR(500) | NULLABLE | Card description (Arabic) |
| price | DECIMAL(10,2) | NOT NULL | Sale price |
| compare_price | DECIMAL(10,2) | NULLABLE | Original price (strikethrough) |
| sku | VARCHAR(100) | UNIQUE, NOT NULL | Stock keeping unit |
| stock | INT | DEFAULT 0 | Available quantity |
| is_active | BOOLEAN | DEFAULT true | Visibility |
| is_featured | BOOLEAN | DEFAULT false | Homepage feature |
| times_purchased | INT | DEFAULT 0 | Purchase count |
| average_rating | DECIMAL(3,2) | DEFAULT 0 | 0-5 rating |
| rating_count | INT | DEFAULT 0 | Number of reviews |
| view_count | INT | DEFAULT 0 | Page views |
| color | VARCHAR(50) | NULLABLE | Color variant name |
| color_hex | VARCHAR(7) | NULLABLE | Hex code (e.g., #000000) |
| available_sizes | JSON | NULLABLE | Array of sizes ["S","M","L"] |
| size_stock | JSON | NULLABLE | Stock per size {"S":10,"M":15} |
| product_group | VARCHAR(100) | NULLABLE | Groups related variants |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

### product_images

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| product_id | BIGINT | FK→products, NOT NULL | Parent product |
| path | VARCHAR(255) | NOT NULL | Storage path |
| alt_text | VARCHAR(255) | NULLABLE | Image alt text |
| sort_order | INT | DEFAULT 0 | Gallery order |
| is_primary | BOOLEAN | DEFAULT false | Main product image |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

### carts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| user_id | BIGINT | FK→users, NULLABLE | Logged-in user |
| session_id | VARCHAR(255) | NULLABLE | Guest session |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Note**: Either `user_id` OR `session_id` will be set, not both.

### cart_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| cart_id | BIGINT | FK→carts, NOT NULL | Parent cart |
| product_id | BIGINT | FK→products, NOT NULL | Product reference |
| quantity | INT | NOT NULL, MIN 1 | Item quantity |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique constraint**: (cart_id, product_id)

### orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| user_id | BIGINT | FK→users, NULLABLE | Customer (if logged in) |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | Display order # |
| status | ENUM | NOT NULL | Order status |
| subtotal | DECIMAL(10,2) | NOT NULL | Pre-tax total |
| tax | DECIMAL(10,2) | DEFAULT 0 | Tax amount |
| total | DECIMAL(10,2) | NOT NULL | Final total |
| customer_name | VARCHAR(255) | NOT NULL | Billing name |
| customer_email | VARCHAR(255) | NOT NULL | Contact email |
| customer_phone | VARCHAR(50) | NULLABLE | Contact phone |
| shipping_address | JSON | NOT NULL | Shipping details |
| billing_address | JSON | NULLABLE | Billing details |
| notes | TEXT | NULLABLE | Customer notes |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Status values**: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

### order_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO | Primary key |
| order_id | BIGINT | FK→orders, NOT NULL | Parent order |
| product_id | BIGINT | FK→products, NULLABLE | Product reference |
| product_name | VARCHAR(255) | NOT NULL | Snapshot at purchase |
| product_sku | VARCHAR(100) | NOT NULL | Snapshot at purchase |
| price | DECIMAL(10,2) | NOT NULL | Price at purchase |
| quantity | INT | NOT NULL | Quantity ordered |
| subtotal | DECIMAL(10,2) | NOT NULL | Line item total |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
```

---

## Seed Data Strategy

The demo includes realistic seed data:

| Entity | Count | Description |
|--------|-------|-------------|
| Users | 2 | 1 admin, 1 demo customer |
| Categories | 8 | Main categories with subcategories |
| Products | 100+ | Across all categories, bilingual |
| Product Images | 300+ | Multiple images per product |
| Orders | 10 | Sample orders in various statuses |

**Main Categories:**
Electronics, Skincare, Building Blocks, Fashion, Home & Kitchen, Sports, Stationery, Kids

**Seeder Order:**
1. UserSeeder - Demo accounts
2. CategorySeeder - Categories & subcategories
3. ProductSeeder - Electronics & Skincare
4. AdditionalProductsSeeder - Fashion, Home, Sports, etc.
5. SlubanProductSeeder - Imports from CSV (Building Blocks)
6. BuildingBlocksSubcategoriesSeeder - Organize Sluban products
7. ProductSubcategoriesSeeder - Redistribute to subcategories
8. SaleProductsSeeder - Add discounts
9. OrderSeeder - Demo orders

See `database/seeders/` for implementation details.
