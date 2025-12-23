<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Electronics - Smartphones
            ['category' => 'smartphones', 'name' => 'ProMax Ultra Phone', 'price' => 999.99, 'compare' => 1199.99, 'stock' => 25, 'featured' => true],
            ['category' => 'smartphones', 'name' => 'Galaxy Elite S24', 'price' => 849.99, 'compare' => null, 'stock' => 30, 'featured' => true],
            ['category' => 'smartphones', 'name' => 'Budget Smart X', 'price' => 299.99, 'compare' => 349.99, 'stock' => 50, 'featured' => false],
            ['category' => 'smartphones', 'name' => 'Pixel Perfect 8', 'price' => 699.99, 'compare' => null, 'stock' => 20, 'featured' => false],

            // Electronics - Laptops
            ['category' => 'laptops', 'name' => 'MacBook Pro 16"', 'price' => 2499.99, 'compare' => null, 'stock' => 15, 'featured' => true],
            ['category' => 'laptops', 'name' => 'ThinkPad X1 Carbon', 'price' => 1799.99, 'compare' => 1999.99, 'stock' => 20, 'featured' => false],
            ['category' => 'laptops', 'name' => 'Gaming Laptop RTX', 'price' => 1499.99, 'compare' => null, 'stock' => 10, 'featured' => true],
            ['category' => 'laptops', 'name' => 'ChromeBook Lite', 'price' => 349.99, 'compare' => 399.99, 'stock' => 40, 'featured' => false],

            // Electronics - Accessories
            ['category' => 'accessories', 'name' => 'Wireless Earbuds Pro', 'price' => 149.99, 'compare' => 179.99, 'stock' => 100, 'featured' => true],
            ['category' => 'accessories', 'name' => 'USB-C Hub 7-in-1', 'price' => 49.99, 'compare' => null, 'stock' => 75, 'featured' => false],
            ['category' => 'accessories', 'name' => 'Fast Charger 65W', 'price' => 39.99, 'compare' => 49.99, 'stock' => 120, 'featured' => false],

            // Clothing - Men's
            ['category' => 'mens-wear', 'name' => 'Classic Oxford Shirt', 'price' => 59.99, 'compare' => null, 'stock' => 50, 'featured' => false],
            ['category' => 'mens-wear', 'name' => 'Slim Fit Chinos', 'price' => 79.99, 'compare' => 99.99, 'stock' => 40, 'featured' => true],
            ['category' => 'mens-wear', 'name' => 'Leather Jacket', 'price' => 299.99, 'compare' => null, 'stock' => 15, 'featured' => true],

            // Clothing - Women's
            ['category' => 'womens-wear', 'name' => 'Floral Summer Dress', 'price' => 89.99, 'compare' => 119.99, 'stock' => 35, 'featured' => true],
            ['category' => 'womens-wear', 'name' => 'High-Waist Jeans', 'price' => 69.99, 'compare' => null, 'stock' => 45, 'featured' => false],
            ['category' => 'womens-wear', 'name' => 'Cashmere Sweater', 'price' => 149.99, 'compare' => 189.99, 'stock' => 25, 'featured' => false],

            // Home - Furniture
            ['category' => 'furniture', 'name' => 'Modern Sofa Set', 'price' => 1299.99, 'compare' => 1599.99, 'stock' => 8, 'featured' => true],
            ['category' => 'furniture', 'name' => 'Ergonomic Office Chair', 'price' => 349.99, 'compare' => null, 'stock' => 30, 'featured' => true],
            ['category' => 'furniture', 'name' => 'Wooden Coffee Table', 'price' => 199.99, 'compare' => 249.99, 'stock' => 20, 'featured' => false],

            // Home - Kitchen
            ['category' => 'kitchen', 'name' => 'Smart Coffee Maker', 'price' => 129.99, 'compare' => null, 'stock' => 40, 'featured' => false],
            ['category' => 'kitchen', 'name' => 'Air Fryer XL', 'price' => 99.99, 'compare' => 129.99, 'stock' => 55, 'featured' => true],
            ['category' => 'kitchen', 'name' => 'Knife Set 12-Piece', 'price' => 79.99, 'compare' => null, 'stock' => 35, 'featured' => false],

            // Sports - Fitness
            ['category' => 'fitness', 'name' => 'Smart Fitness Watch', 'price' => 199.99, 'compare' => 249.99, 'stock' => 60, 'featured' => true],
            ['category' => 'fitness', 'name' => 'Yoga Mat Premium', 'price' => 49.99, 'compare' => null, 'stock' => 80, 'featured' => false],
            ['category' => 'fitness', 'name' => 'Adjustable Dumbbells', 'price' => 299.99, 'compare' => 349.99, 'stock' => 25, 'featured' => false],

            // Health & Beauty - Skincare
            ['category' => 'skincare', 'name' => 'Anti-Aging Serum', 'price' => 89.99, 'compare' => null, 'stock' => 45, 'featured' => true],
            ['category' => 'skincare', 'name' => 'Hydrating Face Cream', 'price' => 39.99, 'compare' => 49.99, 'stock' => 70, 'featured' => false],
            ['category' => 'skincare', 'name' => 'Vitamin C Set', 'price' => 59.99, 'compare' => null, 'stock' => 55, 'featured' => false],

            // Books - Fiction
            ['category' => 'fiction', 'name' => 'The Silent Echo', 'price' => 24.99, 'compare' => null, 'stock' => 100, 'featured' => false],
            ['category' => 'fiction', 'name' => 'Midnight in Paris', 'price' => 19.99, 'compare' => 24.99, 'stock' => 85, 'featured' => true],
        ];

        foreach ($products as $productData) {
            $category = Category::where('slug', $productData['category'])->first();

            if (!$category) {
                continue;
            }

            $product = Product::create([
                'category_id' => $category->id,
                'name' => $productData['name'],
                'slug' => Str::slug($productData['name']),
                'description' => $this->generateDescription($productData['name']),
                'short_description' => "High-quality {$productData['name']} - perfect for your needs.",
                'price' => $productData['price'],
                'compare_price' => $productData['compare'],
                'sku' => strtoupper(Str::random(2) . '-' . rand(1000, 9999)),
                'stock' => $productData['stock'],
                'is_active' => true,
                'is_featured' => $productData['featured'],
            ]);

            // Create product images (using placeholders)
            for ($i = 1; $i <= 3; $i++) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => "products/placeholder-{$i}.jpg",
                    'alt_text' => "{$product->name} - Image {$i}",
                    'sort_order' => $i - 1,
                    'is_primary' => $i === 1,
                ]);
            }
        }
    }

    private function generateDescription(string $name): string
    {
        return "Introducing the {$name} - a premium product designed with quality and functionality in mind. "
            . "This exceptional item combines modern design with practical features to meet your everyday needs. "
            . "Crafted with attention to detail, it represents the perfect balance of style and performance. "
            . "\n\nFeatures:\n"
            . "- Premium quality materials\n"
            . "- Modern, sleek design\n"
            . "- Durable construction\n"
            . "- Easy to use and maintain\n"
            . "\nPerfect for both personal use and as a thoughtful gift.";
    }
}
