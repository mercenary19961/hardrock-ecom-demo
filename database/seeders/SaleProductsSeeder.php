<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class SaleProductsSeeder extends Seeder
{
    /**
     * Add sale discounts (multiples of 5%, between 10-70%) to at least 2 products per category
     */
    public function run(): void
    {
        // Get all parent categories
        $parentCategories = Category::whereNull('parent_id')->get();

        // Discount percentages in multiples of 5 (10% to 70%)
        $discountOptions = [30, 35, 40, 45, 50, 55, 60, 65, 70];

        foreach ($parentCategories as $parentCategory) {
            // Get all category IDs (parent + children)
            $categoryIds = collect([$parentCategory->id]);
            $childIds = Category::where('parent_id', $parentCategory->id)->pluck('id');
            $categoryIds = $categoryIds->merge($childIds);

            // Get products in this category that don't have a high discount already
            $products = Product::whereIn('category_id', $categoryIds)
                ->where(function ($query) {
                    $query->whereNull('compare_price')
                        ->orWhereRaw('((compare_price - price) / compare_price * 100) < 30');
                })
                ->inRandomOrder()
                ->take(3) // Take 3 products per parent category
                ->get();

            foreach ($products as $index => $product) {
                // Pick a random discount from the options (multiples of 5)
                $discountPercent = $discountOptions[array_rand($discountOptions)];

                // Calculate compare_price from current price
                // Formula: compare_price = price / (1 - discount/100)
                $comparePrice = round($product->price / (1 - $discountPercent / 100), 2);

                // Round to a nice price
                $comparePrice = $this->roundToNicePrice($comparePrice);

                // Recalculate actual discount after rounding
                $actualDiscount = round(($comparePrice - $product->price) / $comparePrice * 100);

                $product->update([
                    'compare_price' => $comparePrice,
                ]);

                $this->command->info("Updated {$product->name}: {$product->price} JOD (was {$comparePrice} JOD) - {$actualDiscount}% off");
            }
        }

        $this->command->info('Sale products seeding completed!');
    }

    /**
     * Round price to a nice looking number
     */
    private function roundToNicePrice(float $price): float
    {
        // Round to nearest .99 or .00
        $rounded = round($price);

        if ($rounded < 50) {
            return $rounded;
        } elseif ($rounded < 100) {
            // Round to nearest 5
            return round($rounded / 5) * 5;
        } else {
            // Round to nearest 10
            return round($rounded / 10) * 10;
        }
    }
}
