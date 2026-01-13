<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BuildingBlocksProductSeeder extends Seeder
{
    /**
     * Run the migrations.
     */
    public function run(): void
    {
        // Create parent category "Building Blocks"
        $buildingBlocks = Category::firstOrCreate(
            ['slug' => 'building-blocks'],
            [
                'name' => 'Building Blocks',
                'name_ar' => 'مكعبات البناء',
                'description' => 'Construction and building block sets for creative play',
                'description_ar' => 'مجموعات البناء والتركيب للعب الإبداعي',
                'image' => 'categories/building-blocks.webp',
                'sort_order' => 3,
                'is_active' => true,
            ]
        );

        // Create sub-category "Building Models"
        $buildingModels = Category::firstOrCreate(
            ['slug' => 'building-models'],
            [
                'name' => 'Building Models',
                'name_ar' => 'نماذج البناء',
                'description' => 'Detailed building model sets',
                'description_ar' => 'مجموعات نماذج البناء المفصلة',
                'parent_id' => $buildingBlocks->id,
                'sort_order' => 1,
                'is_active' => true,
            ]
        );

        // Hardcoded products array - top 12 most popular building blocks
        $products = [
            [
                'sku' => 'M38-B1268',
                'name_en' => 'Metropolis D.C. Department Store 718pcs',
                'name_ar' => 'متجر متروبوليس متعدد الأقسام – 725 قطعة',
                'short' => 'Beautifully detailed construction kit from the Metropolis series with 725 pieces and 7 figures.',
                'price' => 38.78,
                'stock' => 48,
                'thumbnail' => 'M38-B1268.webp',
            ],
            [
                'sku' => 'M38-B1286',
                'name_en' => 'Metropolis Ferris Wheel 504pcs',
                'name_ar' => 'عجلة فيريس متروبوليس – 504 قطعة',
                'short' => 'Towering Ferris wheel with rotating carriages and 3 mini-figures.',
                'price' => 21.54,
                'stock' => 48,
                'thumbnail' => 'M38-B1286.webp',
            ],
            [
                'sku' => 'M38-B1285',
                'name_en' => 'Metropolis Roller Coaster 448pcs',
                'name_ar' => 'قطار الملاهي متروبوليس – 448 قطعة',
                'short' => 'Amusement park kit with mini Ferris wheel, ticket booth, and ride platforms.',
                'price' => 21.54,
                'stock' => 48,
                'thumbnail' => 'M38-B1285.webp',
            ],
            [
                'sku' => 'M38-B1267',
                'name_en' => 'Metropolis D.C. Crowne Hotel 428pcs',
                'name_ar' => 'فندق كراون متروبوليس – 428 قطعة',
                'short' => 'Detailed hotel design with windows, doors, and hotel amenities.',
                'price' => 21.54,
                'stock' => 48,
                'thumbnail' => 'M38-B1267.webp',
            ],
            [
                'sku' => 'M38-B1263',
                'name_en' => 'Metropolis Central Train Station 592pcs',
                'name_ar' => 'محطة القطار المركزية متروبوليس – 592 قطعة',
                'short' => 'Realistic central train station with 7 innovative mini-figures.',
                'price' => 38.78,
                'stock' => 48,
                'thumbnail' => 'M38-B1263.webp',
            ],
            [
                'sku' => 'M38-B1266',
                'name_en' => 'Metropolis Slubucks Café 241pcs',
                'name_ar' => 'مقهى سلوبوكس متروبوليس – 241 قطعة',
                'short' => 'Café design with ice cream cart and 3 innovative mini-figures.',
                'price' => 13.78,
                'stock' => 48,
                'thumbnail' => 'M38-B1266.webp',
            ],
            [
                'sku' => 'M38-B1273',
                'name_en' => 'ModelBricks J16 Aircraft Carrier 1041pcs',
                'name_ar' => 'حاملة طائرات J16 – 1041 قطعة',
                'short' => 'Highly detailed military jet model, 19 inches long with realistic details.',
                'price' => 51.72,
                'stock' => 24,
                'thumbnail' => 'M38-B1273.webp',
            ],
            [
                'sku' => 'M38-B1291',
                'name_en' => 'ModelBricks USS Missouri 1739pcs',
                'name_ar' => 'يو إس إس ميزوري – 1739 قطعة',
                'short' => 'Detailed 1/350 scale model of the legendary USS Missouri battleship.',
                'price' => 64.65,
                'stock' => 12,
                'thumbnail' => 'M38-B1291.webp',
            ],
            [
                'sku' => 'M38-P8161',
                'name_en' => 'PLEYERID Peacock with Lighting',
                'name_ar' => 'طائر الطاووس مع إضاءة',
                'short' => 'Stunning peacock design with special lighting for magical ambiance.',
                'price' => 33.61,
                'stock' => 36,
                'thumbnail' => 'M38-P8161.webp',
            ],
            [
                'sku' => 'M38-P8160',
                'name_en' => 'PLEYERID Swans with Lighting 932pcs',
                'name_ar' => 'البجع مع إضاءة – 932 قطعة',
                'short' => 'Elegant swans design with lighting system, 932 pieces.',
                'price' => 33.61,
                'stock' => 36,
                'thumbnail' => 'M38-P8160.webp',
            ],
            [
                'sku' => 'M38-P8070',
                'name_en' => 'PLEYERID Roses 313pcs',
                'name_ar' => 'ورود – 313 قطعة',
                'short' => 'Exquisite rose design capturing natural beauty, 313 pieces.',
                'price' => 14.65,
                'stock' => 72,
                'thumbnail' => 'M38-P8070.webp',
            ],
            [
                'sku' => 'M38-B1335',
                'name_en' => 'POWER BRICKS Formula Car 210pcs',
                'name_ar' => 'سيارة فورمولا – 210 قطعة',
                'short' => 'Formula-style racing car with pull-back motor, 210 pieces.',
                'price' => 12.06,
                'stock' => 72,
                'thumbnail' => 'M38-B1335.webp',
            ],
        ];

        foreach ($products as $productData) {
            // Check if product already exists
            if (Product::where('sku', $productData['sku'])->exists()) {
                continue;
            }

            $product = Product::create([
                'category_id' => $buildingModels->id,
                'name' => $productData['name_en'],
                'name_ar' => $productData['name_ar'],
                'slug' => Str::slug($productData['name_en']),
                'description' => $productData['short'],
                'description_ar' => $productData['name_ar'],
                'short_description' => $productData['short'],
                'short_description_ar' => $productData['name_ar'],
                'price' => $productData['price'],
                'compare_price' => null,
                'sku' => $productData['sku'],
                'stock' => $productData['stock'],
                'is_active' => true,
                'is_featured' => false,
                'times_purchased' => rand(10, 100),
                'average_rating' => rand(35, 50) / 10,
                'rating_count' => rand(5, 50),
                'view_count' => rand(100, 500),
            ]);

            // Create product image
            ProductImage::create([
                'product_id' => $product->id,
                'path' => "products/sluban/{$productData['thumbnail']}",
                'alt_text' => $product->name,
                'sort_order' => 0,
                'is_primary' => true,
            ]);
        }
    }
}
