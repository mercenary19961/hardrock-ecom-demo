<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class FashionVariantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates a single product with multiple color images.
     * Each image represents a different color variant.
     * The color_variants JSON field stores color metadata for each image.
     */
    public function run(): void
    {
        // Get Men's Fashion category
        $mensFashion = Category::where('slug', 'mens-fashion')->first();

        if (!$mensFashion) {
            $this->command->error("Men's Fashion category not found!");
            return;
        }

        // Available sizes for the product
        $availableSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

        // Size stock (combined across all colors for simplicity)
        $sizeStock = [
            'S' => 55,
            'M' => 100,
            'L' => 118,
            'XL' => 75,
            'XXL' => 39,
            '3XL' => 23,
            '4XL' => 13,
        ];

        // Color variants metadata - stored in product JSON field
        $colorVariants = [
            [
                'color' => 'black',
                'color_name' => 'Black',
                'color_name_ar' => 'أسود',
                'color_hex' => '#000000',
                'image_index' => 0,
            ],
            [
                'color' => 'white',
                'color_name' => 'White',
                'color_name_ar' => 'أبيض',
                'color_hex' => '#F5F5F5',
                'image_index' => 1,
            ],
            [
                'color' => 'red',
                'color_name' => 'Red',
                'color_name_ar' => 'أحمر',
                'color_hex' => '#DC2626',
                'image_index' => 2,
            ],
            [
                'color' => 'grey',
                'color_name' => 'Grey',
                'color_name_ar' => 'رمادي',
                'color_hex' => '#6B7280',
                'image_index' => 3,
            ],
        ];

        // Calculate total stock
        $totalStock = array_sum($sizeStock);

        // Create single product
        $product = Product::create([
            'category_id' => $mensFashion->id,
            'name' => 'Zip Up Hoodie for Men - Soft Fleece Lined',
            'name_ar' => 'هودي بسحاب للرجال - بطانة صوف ناعمة',
            'slug' => 'zip-hoodie-men-fleece-lined',
            'description' => "Made From a Premium Cotton-Polyester Blend; This soft and breathable men hoodie provides gentle comfort and balanced warmth. Ideal for daily wear, gym workouts, travel, lounging, or casual outdoor use in all seasons without feeling heavy.\n\nFeatures a Smooth Full-Length Zipper; This durable zip-up hoodie for men offers easy wear without the hassle of pullover styles. Quick front access, reinforced stitching.\n\nAvailable in multiple colors: Black, White, Red, and Grey.",
            'description_ar' => "مصنوع من مزيج قطن وبوليستر فاخر؛ يوفر هذا الهودي الرجالي الناعم والمسامي راحة لطيفة ودفء متوازن. مثالي للارتداء اليومي، التمارين الرياضية، السفر، الاسترخاء، أو الاستخدام الخارجي في جميع الفصول دون الشعور بالثقل.\n\nيتميز بسحاب كامل الطول؛ يوفر هذا الهودي المتين سهولة في الارتداء.\n\nمتوفر بعدة ألوان: أسود، أبيض، أحمر، ورمادي.",
            'short_description' => 'Premium cotton-polyester blend zip-up hoodie with soft fleece lining. Perfect for daily wear and gym.',
            'short_description_ar' => 'هودي بسحاب من مزيج القطن والبوليستر الفاخر مع بطانة صوف ناعمة. مثالي للارتداء اليومي.',
            'price' => 59.99,
            'compare_price' => 79.99,
            'sku' => 'HOOD-MEN-001',
            'stock' => $totalStock,
            'is_active' => true,
            'is_featured' => true,
            'available_sizes' => $availableSizes,
            'size_stock' => $sizeStock,
            'color' => 'black', // Default selected color
            'color_hex' => '#000000',
            // Store color variants metadata as JSON (we'll add a new field for this)
        ]);

        // Create product images - one for each color
        $imageFiles = [
            'products/fashion/black_jacket.webp',
            'products/fashion/white_jacket.webp',
            'products/fashion/red_jacket.webp',
            'products/fashion/grey_jacket.webp',
        ];

        foreach ($imageFiles as $index => $imagePath) {
            ProductImage::create([
                'product_id' => $product->id,
                'path' => $imagePath,
                'alt_text' => "Zip Up Hoodie - {$colorVariants[$index]['color_name']}",
                'sort_order' => $index,
                'is_primary' => $index === 0, // Black is primary/default
            ]);
        }

        $this->command->info("Created: {$product->name}");
        $this->command->info("  - Stock: {$totalStock} units");
        $this->command->info("  - 4 color images added");
        $this->command->info('Fashion variant product seeded successfully!');
    }
}
