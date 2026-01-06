# Database Seeders Documentation

## Overview

This document describes how product images and seeders work together in this e-commerce application.

## Seeder Execution Order

The `DatabaseSeeder.php` calls seeders in this order:

```php
$this->call([
    UserSeeder::class,
    CategorySeeder::class,
    ProductSeeder::class,              // Electronics & Skincare products
    AdditionalProductsSeeder::class,   // More products for Fashion, Home & Kitchen, Sports, Stationery, Kids
    NewCategoriesSeeder::class,        // Additional products for all categories (uses firstOrCreate, no conflicts)
    SlubanProductSeeder::class,        // Building Blocks (Sluban) products
    SaleProductsSeeder::class,         // Add sale discounts to products
    OrderSeeder::class,
]);
```

## Seeder Details

### 1. CategorySeeder
- Creates all parent categories: Electronics, Skincare, Building Blocks, Fashion, Home & Kitchen, Sports, Stationery, Kids
- Creates subcategories (e.g., Smartphones, Laptops, Accessories under Electronics)
- **No products created here**

### 2. ProductSeeder
- **Products**: 25 (Electronics + Skincare)
- **Categories**: Uses existing categories created by CategorySeeder
- **Image path pattern**: `products/{imageFolder}/{product-slug}.webp`
  - Electronics subcategories (smartphones, laptops, accessories) → `products/electronics/`
  - Skincare → `products/skincare/`

### 3. AdditionalProductsSeeder
- **Products**: 20 (Fashion, Home & Kitchen, Sports, Stationery, Kids)
- **Categories**: Uses existing categories by slug lookup
- **Image path pattern**: `products/{image_folder}/{image}` (defined in product data)
- Skips existing products by slug check

### 4. NewCategoriesSeeder
- **Products**: 20 more for Fashion, Home, Sports, Stationery, Kids
- **Categories**: Uses `firstOrCreate` - no conflicts with existing categories
- **Image path pattern**: `products/{image_folder}/{image}` (defined in product data)
- Skips existing products by slug check

### 5. SlubanProductSeeder
- **Products**: ~70 Building Blocks products (imported from CSV)
- **Categories**: Creates "Building Models" subcategory under "Building Blocks" using `firstOrCreate`
- **Image path pattern**: `products/sluban/{image-name}.webp`
- **Data source**: External CSV file at `c:/Users/sabba/Downloads/sulban new - Sheet1.csv`
- Skips existing products by SKU check

### 6. SaleProductsSeeder
- **Products**: Adds sale discounts to ~3 products per parent category
- **Discount range**: 30-70% (multiples of 5)
- Only updates `compare_price` field

### 7. OrderSeeder
- Creates sample orders for demo purposes

## Image Storage Locations

### Seeded Product Images (public/images/)
Located in `public/images/products/`:
```
public/images/products/
├── electronics/     # Smartphones, Laptops, Accessories
├── skincare/        # Skincare products
├── fashion/         # Fashion & Accessories
├── home-kitchen/    # Home & Kitchen
├── sports/          # Sports & Outdoors
├── stationery/      # Books & Stationery
├── kids/            # Baby & Kids
└── sluban/          # Building Blocks (Sluban)
```

### Uploaded Images (storage/)
User-uploaded images go to `storage/app/public/` and are accessed via `/storage/` URL.

## Image URL Resolution

### Frontend (utils.ts - getImageUrl function)
```typescript
export function getImageUrl(path: string | null, productId?: number, sortOrder?: number): string {
    if (!path) {
        // Fallback to picsum.photos placeholder
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    if (path.startsWith('http')) return path;

    // Seeded product images are in public/images/
    if (path.startsWith('products/')) {
        return `/images/${path}`;
    }

    // Uploaded images are in storage/
    return `/storage/${path}`;
}
```

### Backend (ProductImage model - getUrlAttribute)
```php
public function getUrlAttribute(): string
{
    // Check public/images first (seeded products)
    $publicImagesPath = public_path('images/' . $this->path);
    if (file_exists($publicImagesPath)) {
        return asset('images/' . $this->path);
    }

    // Check storage (uploaded images)
    $storagePath = storage_path('app/public/' . $this->path);
    if (file_exists($storagePath)) {
        return asset('storage/' . $this->path);
    }

    // Fallback to picsum.photos
    return "https://picsum.photos/seed/{$seed}/800/800";
}
```

## Important Notes

1. **Always run `php artisan migrate:fresh --seed`** - not just `migrate:fresh`, otherwise no data will be seeded.

2. **Image path convention**: All seeded product image paths start with `products/` which triggers the `/images/` URL prefix.

3. **No conflicts**: All seeders use either:
   - `firstOrCreate` for categories
   - Slug/SKU existence checks for products

4. **APP_URL**: Make sure `.env` has the correct `APP_URL` (e.g., `http://127.0.0.1:8000`) for proper asset URL generation.

## Product Counts by Category (approximate)

| Category | Products |
|----------|----------|
| Electronics (total) | 25 |
| - Smartphones | 7 |
| - Laptops | 7 |
| - Accessories | 6 |
| Skincare | 5 |
| Building Blocks | ~70 |
| Fashion | 8 |
| Home & Kitchen | 8 |
| Sports | 8 |
| Stationery | 8 |
| Kids | 8 |
| **Total** | **~135** |
