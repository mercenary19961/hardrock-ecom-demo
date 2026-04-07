# HardRock E-Commerce Platform

## Product Overview

HardRock is a fully featured online store platform designed for the Jordanian market. It supports both English and Arabic with a seamless right-to-left reading experience for Arabic users. The platform covers everything from product browsing and purchasing to a complete back-office management panel for store administrators.

**Live Demo:** https://demo.hardrock-co.com

---

## Table of Contents

1. [The Shopping Experience](#1-the-shopping-experience)
2. [Store Management (Admin Panel)](#2-store-management-admin-panel)
3. [Bilingual & Arabic Support](#3-bilingual--arabic-support)
4. [Speed & Reliability](#4-speed--reliability)
5. [Platform Summary](#5-platform-summary)

---

## 1. The Shopping Experience

Everything a customer sees and interacts with — from landing on the homepage to receiving their order.

### 1.1 Homepage

The homepage is the storefront's first impression and is designed to drive product discovery.

- **Hero Banner Carousel** — A rotating showcase of promotional banners that auto-advances every 5 seconds. Supports both desktop and mobile image sizes. Customers can navigate with left/right arrows or swipe on mobile.

- **Category Showcase** — A visual grid of all 8 product categories (Electronics, Skincare, Building Blocks, Fashion, Home & Kitchen, Sports, Stationery, Kids). Each category is represented by a branded image card with hover animations. The grid adapts from 2 columns on mobile to 8 on desktop.

- **Featured Products** — Each category highlights its top-selling products in a horizontal scrollable row. Customers can quickly browse bestsellers without leaving the homepage.

- **Sale Section** — A dedicated area showcasing products currently on discount, with visible discount percentage badges.

- **Progressive Loading** — The page structure appears instantly while product data loads in the background with smooth skeleton animations, so customers never stare at a blank screen.

---

### 1.2 Browsing & Discovering Products

#### Category Pages

When a customer clicks on a category, they land on a full browsing page with:

- **Category Banner** — A full-width branded banner image (different for English and Arabic).

- **Subcategory Navigation** — A horizontal row of subcategory pills for quick filtering within the category.

- **Smart Filters** — Customers can narrow down products using:
  - **New Arrivals** — Products added in the last 30 days
  - **Price Range** — A dual-handle slider to set minimum and maximum price
  - **Availability** — Show only in-stock items
  - **Color Options** — Show only products with color choices (appears only when relevant)
  - **Size Options** — Show only products with size choices (appears only when relevant)
  - **Discount Ranges** — Filter by discount brackets (e.g., 10-19% off, 20-29% off). Only shows brackets that actually have products.

- **Sorting** — Sort by Newest, Most Popular, Best Rated, Price Low-to-High, or Price High-to-Low.

- **Mobile-Friendly Filters** — On mobile, filters open in a clean bottom panel with a two-column layout: filter categories on the left, options on the right.

- **Instant Category Switching** — Navigating between categories is seamless — only the product data refreshes, not the entire page.

#### Search

Customers can search for products by name, description, or product code (SKU). Results can be filtered by category and sorted just like category pages.

---

### 1.3 Product Details

Each product has a dedicated page showcasing all its information:

- **Image Gallery** — A main image with a thumbnail strip below. Customers click thumbnails to view different angles or colors.

- **Color Variants** — Products with multiple colors show clickable image thumbnails. Selecting a color switches the main image to show that color.

- **Size Selection** — Products with sizes display selectable size buttons (S, M, L, XL, etc.). Each size shows its available stock count. Sold-out sizes are visibly disabled. Customers must select a size before adding to cart.

- **Price & Discounts** — Current price is prominently displayed. If the product is on sale, the original price appears crossed out with the discount percentage highlighted.

- **Stock Status** — Real-time availability shown per size or for the overall product.

- **Add to Cart** — One-click add with quantity selection. Button shows "In Cart" if the product is already in the customer's cart.

- **Wishlist** — Heart icon to save products for later. Items remain in the wishlist even after being added to cart, with an "In Cart" indicator.

- **Product Description** — Full bilingual description (English and Arabic).

- **Customer Reviews** — Star rating breakdown, individual reviews with titles and comments, "Verified Purchase" badges, and a "Helpful" voting system. Customers who purchased the product can write their own review.

- **Related Products** — A row of products from the same category to encourage further browsing.

---

### 1.4 Shopping Cart

The cart is accessible from any page via the cart icon in the header.

- **Cart Drawer** — A slide-out panel showing all cart items without leaving the current page. Displays product images, names, prices, and quantity controls.

- **Instant Updates** — Quantity changes and removals update immediately in the interface. The server syncs in the background so there's no waiting.

- **Full Cart Page** — A dedicated page with detailed item display, variant information (color/size), per-item subtotals, and a free delivery threshold indicator.

- **Guest Cart** — Customers can add items to their cart without logging in. When they log in or create an account, the cart automatically transfers to their account.

---

### 1.5 Wishlist

- Customers can save products to a wishlist by clicking the heart icon on any product card or product page.
- The wishlist is accessible via a slide-out drawer from the header.
- Items stay in the wishlist after being added to cart (with an "In Cart" badge).
- A "Clear Wishlist" option removes all saved items at once.
- The wishlist heart icon in the header gently pulses when items are saved, drawing attention.

---

### 1.6 Checkout & Orders

#### Checkout

- **Login Required** — Customers are prompted to log in or create an account before checkout.
- **Customer Information** — Name, email, phone number.
- **Shipping Address** — Full address form (address line, city, state, postal code).
- **Order Summary** — All items listed with quantities, prices, and subtotals.
- **Coupon Code** — Input field to apply discount codes. The discount is reflected immediately in the order total.
- **Pricing Breakdown** — Subtotal, tax, shipping fee, discount (if any), and final total.
- **Payment** — Cash on Delivery.
- **WhatsApp Ordering** — Alternative option to send the order via WhatsApp with pre-formatted details.

#### Order Confirmation

After placing an order, customers see a confirmation page with their order number, items, shipping address, and total.

#### Order History

Customers can view all their past orders from their profile, including:
- Order number and date
- Status (Pending, Processing, Shipped, Delivered, Cancelled)
- Total amount and item count
- Tracking information (when available)

---

### 1.7 Customer Profile

A multi-tab profile page for managing account settings:

| Tab | What It Does |
|-----|-------------|
| **Overview** | Displays name, email, phone, avatar, member since date, and email verification status |
| **Orders** | Shows full order history with status tracking |
| **Coupons** | Lists available discount coupons the customer can use |
| **Settings** | Update personal info, change password, upload avatar, or delete account |

---

### 1.8 Discount Coupons

Customers can apply coupon codes at checkout for discounts:

| Coupon | Discount | Conditions |
|--------|----------|------------|
| **WELCOME10** | 10% off | No minimum, up to 50 JOD discount |
| **SAVE20** | 20% off | Minimum 50 JOD order, up to 30 JOD discount |
| **FLAT5** | 5 JOD off | Minimum 25 JOD order |

Coupons have usage limits, per-customer limits, and expiry dates — all managed from the admin panel.

---

### 1.9 Customer Reviews

- Customers who purchased a product can leave a review with a 1-5 star rating, title, and comment.
- Reviews are marked with a "Verified Purchase" badge when applicable.
- Other customers can vote reviews as "Helpful" to surface the most useful feedback.
- A rating histogram shows the distribution of ratings at a glance.
- Each customer can only review a product once but can update their review later.

---

### 1.10 Account & Login

- **Email & Password** — Standard registration and login.
- **Google Sign-In** — One-click account creation and login via Google. Email is automatically verified.
- **Password Reset** — "Forgot password" flow sends a reset link via email.
- **Email Verification** — Verification email sent on registration with a one-click confirmation link.
- **Remember Me** — Option to stay logged in for 30 days.

---

## 2. Store Management (Admin Panel)

The admin panel is a full back-office tool for managing every aspect of the store. Accessible at `/admin` with admin credentials.

---

### 2.1 Dashboard

The dashboard provides a real-time overview of the store's health, refreshing automatically every 30 seconds.

**Key Metrics at a Glance:**

| Metric | What It Shows |
|--------|--------------|
| Total Products | Number of products in the catalog |
| Categories | Total category count |
| Total Orders | All orders placed |
| Revenue | Total earnings from completed orders |
| Average Order Value | Revenue divided by number of orders |
| Pending Orders | Orders awaiting processing |
| Out of Stock | Products with zero inventory |
| Inventory Value | Total value of current stock |
| New Customers | Users who registered in the selected period |
| Active Coupons | Currently valid discount codes |

Each metric shows a **trend indicator** (up/down arrow with percentage) compared to the previous period.

**Dashboard Sections:**

- **Order Pipeline** — Visual status breakdown showing what percentage of orders are pending, processing, shipped, delivered, or cancelled.
- **Revenue Chart** — Time-series graph of daily revenue.
- **Top Selling Products** — Ranked list of best-performing products by sales count.
- **Best Rated Products** — Products with the highest customer ratings.
- **Recent Orders** — Quick view of the 5 most recent orders with direct links.
- **Low Stock Alerts** — Products running low on inventory, color-coded by urgency (red for critical, yellow for warning).
- **Recent Activity** — Log of recent admin actions (product edits, category changes).
- **Recent Reviews** — Latest customer reviews.

**Date Range Filter:** Switch between "Today", "This Week", and "This Month" — all metrics and charts update accordingly.

**Customizable Layout:** Admins can show/hide sections, reorder them, and reset to defaults. Preferences are saved per admin.

---

### 2.2 Product Management

Full control over the product catalog with powerful tools for searching, filtering, editing, and bulk operations.

#### Product Listing

- **Search** by product name or SKU code.
- **Filter** by category, status (active, inactive, out of stock, low stock, on sale, featured).
- **Sort** by name, price, stock level, rating, date added, sales count, or category.
- **Two Views:** Table view with resizable columns, or grid view with product image cards.
- **Bulk Actions:** Select multiple products to activate, deactivate, delete, or export in bulk.
- **Export:** Download product data as CSV, Excel, or JSON files.

#### Adding & Editing Products

- **Bilingual Content** — Enter product name, description, and short description in both English and Arabic.
- **Pricing** — Set current price and optional original price (to show discounts).
- **Inventory** — Set stock level and low-stock alert threshold.
- **Category** — Assign to a category and subcategory.
- **Visibility** — Toggle active/inactive and featured status.

**Product Variants:**

- **Colors** — Assign a color name and hex code to each product image. Customers see image thumbnails as color options.
- **Sizes** — Define available sizes (S, M, L, XL, etc.) and set stock levels individually per size.
- **Stock Matrix** — For products with both colors and sizes, manage stock in a color-by-size grid.

**Image Management:**

- Upload multiple product images.
- Drag to reorder images.
- Set the primary (default) image.
- Assign each image to a color variant.
- Delete images individually.

**Advanced Features:**

- **Duplicate Product** — Clone an existing product as a starting point for a new one.
- **Change History** — View a log of every edit made to the product, showing what changed, the old and new values, who made the change, and when.
- **Undo** — A floating undo button appears after saving changes, allowing you to instantly revert the last edit.
- **Restore from History** — Click "Restore to this state" on any past change to revert the product to that point in time.
- **Conflict Protection** — If two admins edit the same product at the same time, the second admin is warned and asked to refresh before saving — preventing accidental data overwrites.

---

### 2.3 Category Management

Manage the store's category structure with parent-child hierarchy support.

- **Create & Edit** — Set bilingual names and descriptions, upload category thumbnails, set display order, and toggle active/inactive status.
- **Parent-Child Structure** — Categories can have subcategories. The listing shows hierarchy with indentation.
- **Stats Overview** — Total, active, inactive, and empty category counts at a glance.
- **Low Stock Threshold** — Set a per-category threshold for low-stock alerts (overrides the global default).
- **Search & Sort** — Find categories by name, filter by status, sort by name, product count, or date.

---

### 2.4 Order Management

Track, update, and manage all customer orders.

#### Order Listing

- **Quick Stats** — Total orders, pending orders, total revenue, and today's revenue displayed as cards.
- **Search** by order number or customer name.
- **Filter** by order status, payment status, and date range (today, this week, this month, custom range).
- **Order Pipeline** — Visual breakdown of order statuses with percentages and revenue per status.
- **Bulk Actions** — Update status or export multiple orders at once.
- **Export** — Download order data as CSV, Excel, or JSON.

#### Order Details

- **Order Summary** — Order number, date, customer name (linked to their profile), status, payment method, and total.
- **Items List** — Every product in the order with image, name, price, quantity, and subtotal.
- **Pricing Breakdown** — Subtotal, tax, shipping, coupon discount, and final total.
- **Status Management** — Change order status from a dropdown (Pending → Processing → Shipped → Delivered or Cancelled).
- **Tracking Information** — Enter a tracking number and select a carrier. This information is visible to the customer.
- **Admin Notes** — Internal-only notes for the team (not visible to customers).
- **Activity Timeline** — A chronological log showing when the order was created, when the status changed, when tracking was added, and any notes.
- **Print Invoice** — Generate a printer-friendly invoice page.

---

### 2.5 User Management

View and manage all customer and admin accounts.

- **Stats Overview** — Total users, admins, customers, verified/unverified counts, and new registrations in the last 30 days.
- **Search** by name or email. Filter by role (admin or customer).
- **User Profile View** — Detailed page showing:
  - Personal info (name, email, phone, avatar, role, verification status, join date, last login)
  - Shopping stats (total orders, completed orders, total spent, average order value, highest order)
  - Review stats (reviews written, average rating given)
  - Full order history
  - Review history
  - Most purchased products

- **Admin Actions:**
  - Edit user profile (name, email, phone, avatar)
  - Send a password reset email
  - Resend email verification
  - Delete customer accounts (admin accounts are protected)

---

### 2.6 Review Management

Moderate and manage all customer product reviews.

- **Stats** — Total reviews, average rating, verified purchase count, and rating distribution.
- **Search** by reviewer name, email, product name, or review content.
- **Filter** by star rating, verified purchase status, or specific product.
- **Sort** by date, rating, helpful votes, product, or customer.
- **Full Review View** — See the complete review with product info, reviewer details, and rating.
- **Bulk Delete** — Remove multiple inappropriate reviews at once.

---

### 2.7 Coupon Management

Create and manage discount coupons for customers.

- **Stats** — Total coupons, active count, expired count, total uses, and total savings generated.
- **Search** by coupon code or name. Filter by status, type, or start date.

**Creating a Coupon:**

| Setting | Description |
|---------|-------------|
| Code | Unique code customers enter (e.g., WELCOME10) |
| Name | Display name in English and Arabic |
| Description | Details in English and Arabic |
| Type | Percentage off or fixed amount off |
| Value | The discount percentage or JOD amount |
| Maximum Discount | Cap on the discount amount (for percentage coupons) |
| Minimum Order | Minimum cart total required to use the coupon |
| Usage Limit | How many times the coupon can be used in total |
| Per-Customer Limit | How many times each customer can use it |
| Start Date | When the coupon becomes valid |
| Expiry Date | When the coupon stops working |
| Active Toggle | Enable or disable the coupon instantly |

---

### 2.8 Reports & Analytics

A dedicated reporting page with multiple views into store performance.

| Report | What It Shows |
|--------|--------------|
| **Revenue** | Revenue over time (chart), averages, order counts |
| **Order Analysis** | Orders by status with counts and revenue breakdown |
| **Product Performance** | Top sellers by quantity, top rated by reviews, sales by category |
| **Customer Analytics** | Total/new customers, top spenders, average customer value |
| **Category Performance** | Products per category, sales per category, average rating per category |

All reports support date range selection: All Time, Year-to-Date, Quarterly, and Monthly views.

---

### 2.9 Store Settings

Configure global store settings from the admin panel:

| Setting Group | Options |
|--------------|---------|
| **General** | Store name, contact email, store URL, currency display |
| **Currency** | Currency symbol, decimal places, default currency |
| **Inventory** | Global low-stock threshold, inventory tracking toggle, low-stock notifications |

Settings are validated on save with clear error messages and unsaved-change warnings.

---

### 2.10 Activity Tracking & Undo

Every product and category change is automatically logged with full audit trail:

- **Who** made the change
- **When** it happened
- **What** changed (field-by-field before and after values)

**Undo:** After saving any change, a floating undo button lets the admin instantly revert.

**Restore from History:** Any past change entry has a "Restore to this state" button, allowing admins to roll back to any previous version of a product or category.

**Conflict Protection:** If two admins edit the same product simultaneously, the system detects the conflict and prevents the second save from overwriting the first — with a clear notification and a refresh button.

---

## 3. Bilingual & Arabic Support

The entire platform — both the storefront and admin panel — supports English and Arabic with a one-click language toggle in the header.

### What Gets Translated

| Content | How It Works |
|---------|-------------|
| **All UI text** | Buttons, labels, menus, error messages, notifications — everything switches between English and Arabic |
| **Product content** | Each product has separate English and Arabic fields for name, description, and short description |
| **Category content** | Category names and descriptions have English and Arabic versions |
| **Coupon content** | Coupon names and descriptions in both languages |
| **Numbers** | All numbers display in Arabic-Indic numerals when Arabic is selected |
| **Currency** | Displays as "JOD" in English and "دينار" in Arabic |
| **Category banners** | Different banner images for English and Arabic |

### Right-to-Left (RTL) Layout

When Arabic is selected:
- The entire page layout mirrors — navigation, text, and content flow from right to left
- Scroll arrows and navigation buttons adjust their direction
- Form fields align to the right
- Email fields stay left-to-right (since emails are always in English characters)
- Phone numbers display correctly without digit reversal

---

## 4. Speed & Reliability

### Fast Page Loading

- **Instant Page Shell** — The page structure and navigation appear immediately. Product data loads progressively in the background with smooth skeleton animations.
- **Smart Data Fetching** — When switching between categories, only the product data refreshes — the page doesn't fully reload.
- **Lazy Image Loading** — Product images load only when they scroll into view, saving bandwidth.
- **Optimized Queries** — Database queries are tuned and cached to handle traffic efficiently.

### Reliable Cart & Checkout

- **Instant Cart Updates** — Adding items, changing quantities, and removing items update the interface immediately. The server confirms in the background.
- **Stock Validation** — Inventory is checked before checkout to prevent overselling.
- **Guest-to-Account Cart Transfer** — Items added before logging in automatically transfer to the customer's account.

### Admin Dashboard

- **Auto-Refresh** — The admin dashboard updates every 30 seconds to show the latest orders, revenue, and activity without manual refreshing.
- **Conflict Prevention** — The system prevents two admins from accidentally overwriting each other's changes on the same product.

---

## 5. Platform Summary

### Customer Features

| Feature | Description |
|---------|-------------|
| Product browsing | 8 categories with subcategories, advanced filters, and sorting |
| Product variants | Color and size selection with per-variant stock tracking |
| Shopping cart | Persistent cart with instant updates and guest support |
| Wishlist | Save products for later with one click |
| Checkout | Full checkout flow with address forms and coupon codes |
| WhatsApp ordering | Send orders directly via WhatsApp |
| Order tracking | View order history, status updates, and tracking info |
| Customer reviews | Rate and review purchased products |
| Discount coupons | Apply coupon codes for percentage or fixed discounts |
| Customer profile | Manage personal info, password, avatar, and view order history |
| Google sign-in | One-click login and registration via Google |
| Bilingual | Full English and Arabic support with RTL layout |
| Mobile-friendly | Fully responsive design optimized for all screen sizes |

### Admin Features

| Feature | Description |
|---------|-------------|
| Real-time dashboard | Live metrics, charts, trends, and alerts with 30-second auto-refresh |
| Product management | Full catalog control with variants, images, bulk actions, and export |
| Category management | Hierarchical categories with bilingual content and images |
| Order management | Status tracking, tracking numbers, admin notes, activity timeline |
| User management | Customer profiles, stats, order history, and admin actions |
| Review moderation | Search, filter, and manage customer reviews |
| Coupon system | Create flexible coupons with limits, conditions, and expiry dates |
| Reports | Revenue, order, product, customer, and category analytics |
| Store settings | Configure store name, currency, inventory thresholds |
| Activity log | Full audit trail of every admin change with undo and restore |
| Data export | Export products, orders, and users as CSV, Excel, or JSON |
| Conflict protection | Prevents data loss from simultaneous edits |

### Hosting & Infrastructure

| Aspect | Details |
|--------|---------|
| Hosting | Cloud-hosted on Railway (EU West — Amsterdam) with managed database and cache services |
| Security | Encrypted sessions, request validation, and secure authentication |
| Performance | Progressive page loading, image optimization, and query caching |
| Scalability | Designed to handle growing traffic and product catalogs |

---

**Demo Access:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hardrock-demo.com | demo1234 |
| Customer | customer@hardrock-demo.com | demo1234 |

**Live URL:** https://demo.hardrock-co.com
