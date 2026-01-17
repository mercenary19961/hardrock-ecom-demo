<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        // Cache categories for 1 hour - they rarely change
        $categories = Cache::remember('home_categories', 3600, fn () =>
            Category::active()
                ->parents()
                ->ordered()
                ->withCount('activeProducts')
                ->get()
        );

        return Inertia::render('Shop/Home', [
            // Categories load immediately for page structure (cached)
            'categories' => $categories,

            // Featured categories - deferred (loads after initial render)
            'featuredCategories' => Inertia::defer(fn () => $this->getFeaturedCategoryProducts([
                'electronics',
                'building-blocks',
                'skincare',
            ]), 'featured'),

            // Sale products - deferred (loads after initial render)
            'saleProducts' => Inertia::defer(fn () => $this->getSaleProductsWithVariety(8, 25), 'sale'),
        ]);
    }

    /**
     * Get products for featured category sections - OPTIMIZED
     * Uses separate queries per category with LIMIT to avoid loading all products
     */
    private function getFeaturedCategoryProducts(array $slugs): array
    {
        // Get all featured categories in one query
        $featuredCategories = Category::whereIn('slug', $slugs)->get()->keyBy('slug');

        if ($featuredCategories->isEmpty()) {
            return [];
        }

        // Get all child category IDs in one query
        $parentIds = $featuredCategories->pluck('id')->toArray();
        $childCategories = Category::whereIn('parent_id', $parentIds)->get();

        // Build category ID mapping (parent_id => [parent_id, child_ids...])
        $categoryIdMap = [];
        foreach ($featuredCategories as $category) {
            $categoryIdMap[$category->id] = [$category->id];
        }
        foreach ($childCategories as $child) {
            if (isset($categoryIdMap[$child->parent_id])) {
                $categoryIdMap[$child->parent_id][] = $child->id;
            }
        }

        // Build result with individual queries (with LIMIT) per category
        $result = [];
        foreach ($slugs as $slug) {
            $category = $featuredCategories->get($slug);
            if (!$category) {
                continue;
            }

            $categoryIds = $categoryIdMap[$category->id] ?? [$category->id];

            // Query with LIMIT 8 - much faster than loading all and filtering
            $products = Product::with(['images'])
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

        return $result;
    }

    /**
     * Get sale products with variety across categories - OPTIMIZED
     * Filter discount in SQL and limit query results
     */
    private function getSaleProductsWithVariety(int $limit = 8, int $minDiscountPercent = 15): Collection
    {
        // Filter by minimum discount in SQL - much faster than loading 50 and filtering
        $productsToUse = Product::with(['category', 'images'])
            ->active()
            ->whereNotNull('compare_price')
            ->where('compare_price', '>', 0)
            ->whereColumn('compare_price', '>', 'price')
            // Filter discount percentage in SQL
            ->whereRaw('((compare_price - price) * 100.0 / compare_price) >= ?', [$minDiscountPercent])
            ->orderByRaw('((compare_price - price) * 1.0 / compare_price) DESC')
            ->take(20)  // Reduced from 50 - enough for variety with 8 final products
            ->get();

        // Group products by parent category for variety (category already eager loaded)
        $productsByCategory = $productsToUse->groupBy(function ($product) {
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
