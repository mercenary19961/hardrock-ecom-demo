# Demo Script (3-5 Minutes)

## Pre-Demo Checklist

- [ ] Open https://demo.hardrock-co.com in a fresh browser (incognito recommended)
- [ ] Have admin credentials ready: admin@hardrock-co.com / demo1234
- [ ] Clear any previous cart items
- [ ] Ensure demo data is seeded (products visible)

---

## Demo Flow

### Opening (30 seconds)

> "This is our e-commerce demo platform built on the same technology stack as our main HardRock website - Laravel, React, and TypeScript. It's designed to showcase what a full-featured online store can look like."

**Show**: Homepage with featured products

---

### Part 1: Storefront Experience (1.5 minutes)

#### Browse Categories
> "Customers can browse products by category..."

**Actions**:
1. Click on a main category in the navigation
2. Show the category page with product grid
3. Point out filters/sorting options (if implemented)

#### Product Details
> "Each product has a detailed page with multiple images, descriptions, and pricing..."

**Actions**:
1. Click on a product card
2. Show image gallery (click through images)
3. Highlight price, description, stock status
4. Point out the "Add to Cart" button

#### Search
> "Customers can also search for specific products..."

**Actions**:
1. Use the search bar
2. Type a product name
3. Show search results

---

### Part 2: Shopping Cart (1 minute)

> "The cart system is fully functional..."

**Actions**:
1. Add a product to cart
2. Show cart drawer/page opening
3. Add another product
4. Update quantity of an item
5. Show cart total updating in real-time
6. Remove an item

> "Cart data persists across sessions for logged-in users, and works for guest shoppers too."

---

### Part 3: Checkout Flow (1 minute)

> "The checkout process is streamlined and secure..."

**Actions**:
1. Click "Proceed to Checkout"
2. Fill in shipping information (use demo data)
3. Show form validation
4. Complete the demo order
5. Show order confirmation page

> "In production, this would integrate with payment providers like Stripe or PayPal. For this demo, we're simulating the payment step."

---

### Part 4: Admin Panel (1 minute)

> "On the backend, administrators have full control..."

**Actions**:
1. Navigate to /admin or click Admin link
2. Log in with admin credentials
3. Show dashboard with key metrics

#### Product Management
> "Products can be added, edited, and managed easily..."

**Actions**:
1. Go to Products section
2. Show product list with search/filter
3. Click "Edit" on a product
4. Show the edit form with image upload
5. Point out inventory/stock management

#### Order Management
> "All orders are tracked and can be managed..."

**Actions**:
1. Go to Orders section
2. Show order list with status badges
3. Click on an order to show details
4. Demonstrate status update (e.g., Processing → Shipped)

---

### Closing (30 seconds)

> "This demo represents a foundation that can be customized for any client's specific needs - different product types, payment integrations, shipping providers, and branding. The codebase is well-documented and follows our standard development practices, making it easy to extend and maintain."

**Optional talking points**:
- Mobile responsiveness (resize browser or mention)
- Performance (fast load times)
- SEO-friendly (server-rendered with Inertia)
- Scalable architecture

---

## Key Features to Highlight

| Feature | Where to Show | Talking Point |
|---------|---------------|---------------|
| Responsive Design | Resize browser | "Works on all devices" |
| Fast Performance | Page navigation | "Server-side rendering with client interactivity" |
| Real-time Updates | Cart total | "No page refreshes needed" |
| Image Management | Admin product edit | "Easy multi-image upload" |
| Order Tracking | Admin orders | "Complete order lifecycle" |
| Search | Header search bar | "Instant product search" |

---

## Common Questions & Answers

**Q: Can this integrate with [Payment Provider]?**
> "Yes, the checkout is designed to plug into Stripe, PayPal, or any payment gateway. We'd implement the specific integration based on client requirements."

**Q: How does inventory work?**
> "Stock levels are tracked automatically. When an order is placed, inventory is decremented. Admins can set stock levels and get notified when running low."

**Q: Can we add [Custom Feature]?**
> "Absolutely. This is a starting point - we can add customer accounts, wishlists, reviews, discount codes, or any feature the project needs."

**Q: How long to customize for our brand?**
> "Basic branding (colors, logo, content) can be done quickly. More complex customizations depend on the specific requirements."

---

## Demo Reset

If you need to reset the demo data between presentations:

```bash
# Via Railway CLI
railway run php artisan migrate:fresh --seed

# Or via Railway shell
php artisan migrate:fresh --seed
```

**Warning**: This removes all data including any orders created during previous demos.
