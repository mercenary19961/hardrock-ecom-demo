<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Collection;
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
     * Get products for featured category sections - OPTIMIZED
     * Uses 3 queries instead of N queries per category
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

        // Get all category IDs we need products for
        $allCategoryIds = collect($categoryIdMap)->flatten()->unique()->toArray();

        // Fetch all products in one query, then group by parent category
        $allProducts = Product::with(['category', 'images'])
            ->whereIn('category_id', $allCategoryIds)
            ->active()
            ->orderBy('times_purchased', 'desc')
            ->get();

        // Build result maintaining original slug order
        $result = [];
        foreach ($slugs as $slug) {
            $category = $featuredCategories->get($slug);
            if (!$category) {
                continue;
            }

            $categoryIds = $categoryIdMap[$category->id] ?? [$category->id];

            // Filter products for this category and take 8
            $products = $allProducts
                ->whereIn('category_id', $categoryIds)
                ->take(8)
                ->values();

            $result[] = [
                'category' => $category,
                'products' => $products,
            ];
        }

        return $result;
    }

    /**
     * Get sale products with variety across categories - OPTIMIZED
     * Single query with fallback logic handled in PHP
     */
    private function getSaleProductsWithVariety(int $limit = 8, int $minDiscountPercent = 15): Collection
    {
        // Single query to get all sale products ordered by discount
        $allSaleProducts = Product::with(['category', 'images'])
            ->active()
            ->whereNotNull('compare_price')
            ->where('compare_price', '>', 0)
            ->whereColumn('compare_price', '>', 'price')
            ->orderByRaw('((compare_price - price) * 1.0 / compare_price) DESC')
            ->get();

        // Filter for minimum discount in PHP (avoids second query)
        $highDiscountProducts = $allSaleProducts->filter(function ($product) use ($minDiscountPercent) {
            $discount = (($product->compare_price - $product->price) / $product->compare_price) * 100;
            return $discount >= $minDiscountPercent;
        });

        // Use high discount products if enough, otherwise use all
        $productsToUse = $highDiscountProducts->count() >= $limit
            ? $highDiscountProducts
            : $allSaleProducts;

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
