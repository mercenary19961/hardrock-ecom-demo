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
        // Products on sale (have compare_price > price)
        $saleProducts = Product::with(['category', 'images'])
            ->active()
            ->whereNotNull('compare_price')
            ->where('compare_price', '>', 0)
            ->whereColumn('compare_price', '>', 'price')
            ->orderByRaw('((compare_price - price) / compare_price) DESC') // Order by discount percentage (highest first)
            ->take(8)
            ->get();

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
}
