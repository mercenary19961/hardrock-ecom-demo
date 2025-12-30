<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Carbon\Carbon;
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

        // New Arrivals filter (last 30-60 days, or latest products if none)
        if ($request->boolean('new_arrivals')) {
            $thirtyDaysAgo = Carbon::now()->subDays(30);
            $sixtyDaysAgo = Carbon::now()->subDays(60);

            // Check if there are products in the last 30 days
            $recentCount = Product::whereIn('category_id', $categoryIds)
                ->active()
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            if ($recentCount > 0) {
                $query->where('created_at', '>=', $thirtyDaysAgo);
            } else {
                // Check 60 days
                $extendedCount = Product::whereIn('category_id', $categoryIds)
                    ->active()
                    ->where('created_at', '>=', $sixtyDaysAgo)
                    ->count();

                if ($extendedCount > 0) {
                    $query->where('created_at', '>=', $sixtyDaysAgo);
                } else {
                    // Just show the latest products (top 12 by created_at)
                    $query->orderBy('created_at', 'desc');
                }
            }
            $filters['new_arrivals'] = true;
        }

        // Below 100 JOD filter
        if ($request->boolean('below_100')) {
            $query->where('price', '<', 100);
            $filters['below_100'] = true;
        }

        // Min/Max price filters
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

        // Minimum discount filter (10%, 20%, 30%, etc.)
        if ($request->filled('min_discount')) {
            $minDiscount = (int) $request->get('min_discount');
            if ($minDiscount > 0 && $minDiscount <= 100) {
                // Calculate minimum discount percentage
                // discount % = ((compare_price - price) / compare_price) * 100 >= $minDiscount
                // This means: compare_price - price >= compare_price * ($minDiscount / 100)
                // Or: price <= compare_price * (1 - $minDiscount / 100)
                $multiplier = 1 - ($minDiscount / 100);
                $query->whereNotNull('compare_price')
                    ->whereColumn('compare_price', '>', 'price')
                    ->whereRaw('price <= compare_price * ?', [$multiplier]);
                $filters['min_discount'] = $minDiscount;
            }
        }

        // In stock filter
        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
            $filters['in_stock'] = true;
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

        return Inertia::render('Shop/Category', [
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
