<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        // Products on sale with variety across categories
        // Prioritize higher discounts (25%+) and ensure category diversity
        $saleProducts = $this->getSaleProductsWithVariety(8, 25);

        $categories = Category::active()
            ->parents()
            ->ordered()
            ->withCount('activeProducts')
            ->get();

        // Featured category sections
        $featuredCategories = $this->getFeaturedCategoryProducts([
            'electronics',
            'building-blocks',
            'skincare',
        ]);

        return Inertia::render('Shop/Home', [
            'saleProducts' => $saleProducts,
            'categories' => $categories,
            'featuredCategories' => $featuredCategories,
        ]);
    }

    /**
     * Get products for featured category sections
     */
    private function getFeaturedCategoryProducts(array $slugs): array
    {
        $result = [];

        foreach ($slugs as $slug) {
            $category = Category::where('slug', $slug)->first();

            if ($category) {
                // Get products from this category and its children
                $categoryIds = collect([$category->id]);

                // Include child category IDs
                $childIds = Category::where('parent_id', $category->id)->pluck('id');
                $categoryIds = $categoryIds->merge($childIds);

                $products = Product::with(['category', 'images'])
                    ->whereIn('category_id', $categoryIds)
                    ->active()
                    ->orderBy('times_purchased', 'desc')
                    ->take(8)
                    ->get();

                $result[] = [
                    'category' => $category,
                    'products' => $products,
                ];
            }
        }

        return $result;
    }

    /**
     * Get sale products with variety across categories
     * Prioritizes higher discounts and ensures category diversity
     */
    private function getSaleProductsWithVariety(int $limit = 8, int $minDiscountPercent = 15): \Illuminate\Support\Collection
    {
        // Get all products on sale with their discount percentage
        $allSaleProducts = Product::with(['category', 'images'])
            ->active()
            ->whereNotNull('compare_price')
            ->where('compare_price', '>', 0)
            ->whereColumn('compare_price', '>', 'price')
            // Only include products with minimum discount percentage (use float division)
            ->whereRaw('((compare_price - price) * 100.0 / compare_price) >= ?', [$minDiscountPercent])
            ->orderByRaw('((compare_price - price) * 1.0 / compare_price) DESC')
            ->get();

        // If not enough products with high discount, include lower discounts
        if ($allSaleProducts->count() < $limit) {
            $allSaleProducts = Product::with(['category', 'images'])
                ->active()
                ->whereNotNull('compare_price')
                ->where('compare_price', '>', 0)
                ->whereColumn('compare_price', '>', 'price')
                ->orderByRaw('((compare_price - price) * 1.0 / compare_price) DESC')
                ->get();
        }

        // Group products by parent category for variety
        $productsByCategory = $allSaleProducts->groupBy(function ($product) {
            // Get the parent category ID (or current category if it's a parent)
            $category = $product->category;
            return $category?->parent_id ?? $category?->id ?? 0;
        });

        $result = collect();
        $categoryCount = max(1, $productsByCategory->count());
        $initialMaxPerCategory = max(2, ceil($limit / $categoryCount));

        // Round-robin selection from each category to ensure variety
        $categoryIterators = $productsByCategory->map(fn($products) => $products->values());
        $categoryIndices = $productsByCategory->keys()->mapWithKeys(fn($key) => [$key => 0]);
        $categoryMaxReached = $productsByCategory->keys()->mapWithKeys(fn($key) => [$key => false]);

        while ($result->count() < $limit) {
            $addedThisRound = false;

            // Calculate dynamic max per category based on remaining slots and active categories
            $activeCategories = $categoryMaxReached->filter(fn($reached) => !$reached)->count();
            $remainingSlots = $limit - $result->count();
            $dynamicMax = $activeCategories > 0 ? max($initialMaxPerCategory, ceil($remainingSlots / $activeCategories) + $result->count() / $categoryCount) : $limit;

            foreach ($categoryIterators as $categoryId => $products) {
                if ($result->count() >= $limit) break;

                $index = $categoryIndices[$categoryId];
                $categoryProductCount = $result->where(function ($p) use ($categoryId) {
                    $cat = $p->category;
                    $parentId = $cat?->parent_id ?? $cat?->id ?? 0;
                    return $parentId === $categoryId;
                })->count();

                // Check if we've exhausted this category
                if ($index >= $products->count()) {
                    $categoryMaxReached[$categoryId] = true;
                    continue;
                }

                // In first pass, respect initial max; after that, fill remaining slots
                $effectiveMax = $categoryMaxReached->contains(true) ? $limit : $initialMaxPerCategory;

                if ($categoryProductCount >= $effectiveMax) {
                    continue;
                }

                $result->push($products[$index]);
                $categoryIndices[$categoryId] = $index + 1;
                $addedThisRound = true;
            }

            // Break if no products were added (all categories exhausted)
            if (!$addedThisRound) break;
        }

        // Sort final result by discount percentage (highest first)
        return $result->sortByDesc(function ($product) {
            return ($product->compare_price - $product->price) / $product->compare_price;
        })->values();
    }
}
