<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function show(Request $request, Category $category): Response
    {
        if (!$category->is_active) {
            abort(404);
        }

        // Get category IDs including children for parent categories
        $childIds = $category->children()->pluck('id')->toArray();
        $categoryIds = array_merge([$category->id], $childIds);

        $query = Product::with(['images'])
            ->whereIn('category_id', $categoryIds)
            ->active();

        // Apply filters
        $filters = [];

        if ($request->filled('min_price')) {
            $minPrice = (float) $request->get('min_price');
            $query->where('price', '>=', $minPrice);
            $filters['min_price'] = $minPrice;
        }

        if ($request->filled('max_price')) {
            $maxPrice = (float) $request->get('max_price');
            $query->where('price', '<=', $maxPrice);
            $filters['max_price'] = $maxPrice;
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
            $filters['in_stock'] = true;
        }

        if ($request->boolean('on_sale')) {
            $query->whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price');
            $filters['on_sale'] = true;
        }

        // Sorting
        $sort = $request->get('sort', 'newest');
        $query = match ($sort) {
            'sale' => $query->whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price')
                ->orderByRaw('(compare_price - price) / compare_price DESC'),
            'price_low' => $query->orderBy('price', 'asc'),
            'price_high' => $query->orderBy('price', 'desc'),
            'name' => $query->orderBy('name', 'asc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $products = $query->paginate(12)->withQueryString();

        $subcategories = $category->children()->active()->ordered()->get();

        // Get price range for the filter UI
        $priceRange = Product::whereIn('category_id', $categoryIds)
            ->active()
            ->selectRaw('MIN(price) as min, MAX(price) as max')
            ->first();

        return Inertia::render('Shop/Landing', [
            'category' => $category,
            'products' => $products,
            'subcategories' => $subcategories,
            'sort' => $sort,
            'filters' => $filters,
            'priceRange' => [
                'min' => (float) ($priceRange->min ?? 0),
                'max' => (float) ($priceRange->max ?? 0),
            ],
        ]);
    }
}
