<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class BuildingBlocksSubcategoriesSeeder extends Seeder
{
    public function run(): void
    {
        // Get the parent Building Blocks category
        $buildingBlocks = Category::where('slug', 'building-blocks')->first();

        if (!$buildingBlocks) {
            $this->command->error('Building Blocks category not found!');
            return;
        }

        $this->command->info("Found Building Blocks category (ID: {$buildingBlocks->id})");

        // Define subcategories with Arabic translations
        $subcategories = [
            'flowers-plants' => [
                'name' => 'Flowers & Plants',
                'name_ar' => 'الزهور والنباتات',
                'description' => 'Beautiful flower and plant building sets',
                'description_ar' => 'مجموعات بناء الزهور والنباتات الجميلة',
                'sort_order' => 1,
            ],
            'vehicles' => [
                'name' => 'Vehicles',
                'name_ar' => 'المركبات',
                'description' => 'Cars, motorcycles, trucks and other vehicles',
                'description_ar' => 'السيارات والدراجات والشاحنات والمركبات الأخرى',
                'sort_order' => 2,
            ],
            'military' => [
                'name' => 'Military',
                'name_ar' => 'العسكرية',
                'description' => 'Military vehicles, tanks, and aircraft',
                'description_ar' => 'المركبات العسكرية والدبابات والطائرات',
                'sort_order' => 3,
            ],
            'ships-boats' => [
                'name' => 'Ships & Boats',
                'name_ar' => 'السفن والقوارب',
                'description' => 'Ships, boats, and maritime vessels',
                'description_ar' => 'السفن والقوارب والمراكب البحرية',
                'sort_order' => 4,
            ],
            'city-buildings' => [
                'name' => 'City & Buildings',
                'name_ar' => 'المدينة والمباني',
                'description' => 'City buildings, stores, and urban structures',
                'description_ar' => 'مباني المدينة والمتاجر والهياكل الحضرية',
                'sort_order' => 5,
            ],
            'animals' => [
                'name' => 'Animals & Creatures',
                'name_ar' => 'الحيوانات والمخلوقات',
                'description' => 'Animal and creature building sets',
                'description_ar' => 'مجموعات بناء الحيوانات والمخلوقات',
                'sort_order' => 6,
            ],
        ];

        // Create subcategories
        $categoryIds = [];
        foreach ($subcategories as $slug => $data) {
            $category = Category::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $data['name'],
                    'name_ar' => $data['name_ar'],
                    'description' => $data['description'],
                    'description_ar' => $data['description_ar'],
                    'parent_id' => $buildingBlocks->id,
                    'sort_order' => $data['sort_order'],
                    'is_active' => true,
                ]
            );
            $categoryIds[$slug] = $category->id;
            $this->command->info("Created/Updated subcategory: {$data['name']} (ID: {$category->id})");
        }

        // Delete the old "Building Models" category if it exists and has no unique purpose
        $buildingModels = Category::where('slug', 'building-models')->first();

        // Define product categorization rules based on product names
        $productRules = [
            // Flowers & Plants - PLEYERID flowers, roses, plants
            'flowers-plants' => [
                'roses', 'rose', 'daisy', 'lavender', 'freesia', 'lotus', 'peony',
                'lilies', 'valley', 'tibouchina', 'protea', 'cynaroides', 'flower',
                'plant', 'music box', 'merry-go-round',
            ],
            // Vehicles - cars, motorcycles, buses
            'vehicles' => [
                'car(pull', 'vintage car', 'formula car', 'racing car', 'motorcycle',
                'bus', 'delivery truck', 'rescue vehicle', 'camping', 'r1250',
                's1000ms',
            ],
            // Military - army, tanks, military aircraft
            'military' => [
                'army', 'tank', 'armata', 'pantsir', 'btr80', 'bmd-2', 'armored',
                'infantry', 'assault', 'stryker', 'battle tank', 'oef-',
            ],
            // Ships & Boats
            'ships-boats' => [
                'titanic', 'fishing-boat', 'fishing boat', 'missouri', 'frigate',
                'ship', 'boat', 'constitution', 'carrier', 'shark',
            ],
            // City & Buildings - Metropolis series
            'city-buildings' => [
                'metropolis', 'department store', 'hotel', 'station', 'store',
                'ferris wheel', 'roller coaster', 'star gate', 'slubucks',
                'hospital', 'police',
            ],
            // Animals & Creatures
            'animals' => [
                'peacock', 'swan', 'bulldog', 'cat', 'x-miu',
            ],
        ];

        // Get all products in Building Blocks category (including old Building Models)
        $products = Product::whereIn('category_id', [$buildingBlocks->id, $buildingModels?->id ?? 0])->get();

        $this->command->info("\nCategorizing {$products->count()} products...\n");

        $categorized = 0;
        $uncategorized = [];

        foreach ($products as $product) {
            $productNameLower = strtolower($product->name);
            $assigned = false;

            foreach ($productRules as $categorySlug => $keywords) {
                foreach ($keywords as $keyword) {
                    if (str_contains($productNameLower, strtolower($keyword))) {
                        $product->category_id = $categoryIds[$categorySlug];
                        $product->save();
                        $this->command->info("  [{$subcategories[$categorySlug]['name']}] {$product->name}");
                        $assigned = true;
                        $categorized++;
                        break 2;
                    }
                }
            }

            if (!$assigned) {
                $uncategorized[] = $product->name;
            }
        }

        // Put uncategorized products in City & Buildings as default (most common category)
        if (!empty($uncategorized)) {
            $this->command->warn("\nUncategorized products (assigned to City & Buildings):");
            foreach ($uncategorized as $name) {
                $this->command->warn("  - {$name}");
                Product::where('name', $name)->update(['category_id' => $categoryIds['city-buildings']]);
            }
        }

        // Now we can safely delete the old Building Models category if empty
        if ($buildingModels) {
            $remainingProducts = Product::where('category_id', $buildingModels->id)->count();
            if ($remainingProducts === 0) {
                $buildingModels->delete();
                $this->command->info("\nDeleted old 'Building Models' category (was empty)");
            } else {
                $this->command->warn("\nOld 'Building Models' category still has {$remainingProducts} products");
            }
        }

        $this->command->info("\n✓ Categorization complete! {$categorized} products categorized.");
    }
}
