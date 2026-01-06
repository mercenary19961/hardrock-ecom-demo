<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSubcategoriesSeeder extends Seeder
{
    /**
     * Redistribute products from parent categories into their appropriate subcategories
     * based on product name keywords.
     */
    public function run(): void
    {
        $this->categorizeElectronics();
        $this->categorizeFashion();
        $this->categorizeHomeKitchen();
        $this->categorizeSports();
        $this->categorizeStationery();
        $this->categorizeKids();

        $this->command->info("\n✓ Product subcategory redistribution complete!");
    }

    private function categorizeElectronics(): void
    {
        $parent = Category::where('slug', 'electronics')->first();
        if (!$parent) return;

        $subcategories = [
            'smartphones' => ['phone', 'iphone', 'samsung galaxy', 'pixel', 'smartphone'],
            'laptops' => ['laptop', 'macbook', 'notebook', 'thinkpad', 'chromebook'],
            'accessories' => ['charger', 'cable', 'case', 'earbuds', 'airpods', 'headphone', 'speaker', 'mouse', 'keyboard', 'stand', 'hub', 'adapter'],
        ];

        $this->redistributeProducts($parent, $subcategories, 'Electronics');
    }

    private function categorizeFashion(): void
    {
        $parent = Category::where('slug', 'fashion')->first();
        if (!$parent) return;

        $subcategories = [
            'mens-fashion' => ['men', "men's", 'male', 'gentleman', 'belt', 'beanie', 'watch', 'sunglasses', 'crossbody'],
            'womens-fashion' => ['women', "women's", 'female', 'lady', 'ladies', 'dress', 'handbag', 'purse', 'tote bag', 'bracelet', 'scarf'],
        ];

        $this->redistributeProducts($parent, $subcategories, 'Fashion', 'mens-fashion');
    }

    private function categorizeHomeKitchen(): void
    {
        $parent = Category::where('slug', 'home-kitchen')->first();
        if (!$parent) return;

        $subcategories = [
            'kitchen-appliances' => ['blender', 'mixer', 'toaster', 'kettle', 'coffee', 'pan', 'pot', 'knife', 'cutting board', 'container', 'kitchen', 'cook'],
            'home-decor' => ['lamp', 'light', 'pillow', 'blanket', 'curtain', 'rug', 'vase', 'frame', 'decor', 'candle', 'mirror'],
        ];

        $this->redistributeProducts($parent, $subcategories, 'Home & Kitchen', 'kitchen-appliances');
    }

    private function categorizeSports(): void
    {
        $parent = Category::where('slug', 'sports')->first();
        if (!$parent) return;

        $subcategories = [
            'fitness-equipment' => ['dumbbell', 'weight', 'yoga', 'mat', 'resistance', 'band', 'foam roller', 'exercise', 'fitness', 'gym', 'workout', 'treadmill'],
            'sports-gear' => ['ball', 'racket', 'bat', 'glove', 'helmet', 'jersey', 'shoe', 'bag', 'rope', 'jump rope', 'bottle', 'gear'],
        ];

        $this->redistributeProducts($parent, $subcategories, 'Sports', 'fitness-equipment');
    }

    private function categorizeStationery(): void
    {
        $parent = Category::where('slug', 'stationery')->first();
        if (!$parent) return;

        $subcategories = [
            'office-supplies' => ['pen', 'pencil', 'stapler', 'clip', 'folder', 'binder', 'tape', 'scissors', 'calculator', 'desk', 'organizer', 'office'],
            'school-supplies' => ['notebook', 'backpack', 'ruler', 'eraser', 'crayon', 'marker', 'color', 'school', 'student'],
        ];

        $this->redistributeProducts($parent, $subcategories, 'Stationery', 'office-supplies');
    }

    private function categorizeKids(): void
    {
        $parent = Category::where('slug', 'kids')->first();
        if (!$parent) return;

        $subcategories = [
            'toys' => ['toy', 'game', 'puzzle', 'doll', 'car', 'robot', 'lego', 'block', 'play', 'fun'],
            'kids-clothing' => ['shirt', 'pants', 'dress', 'jacket', 'shoe', 'sock', 'hat', 'clothes', 'wear', 'outfit', 'blanket', 'backpack'],
        ];

        $this->redistributeProducts($parent, $subcategories, 'Kids', 'toys');
    }

    private function redistributeProducts(Category $parent, array $subcategories, string $categoryName, ?string $defaultSubcategory = null): void
    {
        // Get subcategory IDs
        $subcategoryIds = [];
        foreach (array_keys($subcategories) as $slug) {
            $sub = Category::where('slug', $slug)->where('parent_id', $parent->id)->first();
            if ($sub) {
                $subcategoryIds[$slug] = $sub->id;
            }
        }

        if (empty($subcategoryIds)) {
            $this->command->warn("No subcategories found for {$categoryName}");
            return;
        }

        // Get products in parent category only (not already in subcategories)
        $products = Product::where('category_id', $parent->id)->get();

        if ($products->isEmpty()) {
            $this->command->info("{$categoryName}: No products to redistribute");
            return;
        }

        $this->command->info("\n{$categoryName}: Redistributing {$products->count()} products...");

        $categorized = 0;
        $uncategorized = [];

        foreach ($products as $product) {
            $productNameLower = strtolower($product->name);
            $assigned = false;

            foreach ($subcategories as $slug => $keywords) {
                if (!isset($subcategoryIds[$slug])) continue;

                foreach ($keywords as $keyword) {
                    if (str_contains($productNameLower, strtolower($keyword))) {
                        $product->category_id = $subcategoryIds[$slug];
                        $product->save();
                        $this->command->info("  [{$slug}] {$product->name}");
                        $assigned = true;
                        $categorized++;
                        break 2;
                    }
                }
            }

            if (!$assigned) {
                $uncategorized[] = $product;
            }
        }

        // Assign uncategorized products to default subcategory
        if (!empty($uncategorized) && $defaultSubcategory && isset($subcategoryIds[$defaultSubcategory])) {
            $this->command->warn("  Assigning " . count($uncategorized) . " uncategorized products to {$defaultSubcategory}:");
            foreach ($uncategorized as $product) {
                $product->category_id = $subcategoryIds[$defaultSubcategory];
                $product->save();
                $this->command->warn("    - {$product->name}");
                $categorized++;
            }
        }

        $this->command->info("  ✓ {$categorized} products categorized");
    }
}
