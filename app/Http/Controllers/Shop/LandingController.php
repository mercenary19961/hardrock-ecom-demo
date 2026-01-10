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

        // Quick price range filters
        if ($request->filled('price_range')) {
            $priceRangeFilter = $request->get('price_range');
            match ($priceRangeFilter) {
                'under_25' => $query->where('price', '<=', 25),
                '25_to_50' => $query->where('price', '>', 25)->where('price', '<=', 50),
                'over_50' => $query->where('price', '>', 50),
                default => null,
            };
            $filters['price_range'] = $priceRangeFilter;
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

        // Discount range filter (10-19%, 20-29%, etc.)
        // Uses [min%, max%) range - inclusive lower, exclusive upper
        if ($request->filled('min_discount')) {
            $minDiscount = (int) $request->get('min_discount');
            $maxDiscount = $request->filled('max_discount') ? (int) $request->get('max_discount') : 100;

            if ($minDiscount > 0 && $minDiscount <= 100) {
                // Filter products within the discount range
                // discount % = ((compare_price - price) / compare_price) * 100
                // Rearranged: price = compare_price * (1 - discount/100)
                // For range [min, max): min <= discount < max
                $lowerMultiplier = 1 - ($minDiscount / 100);
                $upperMultiplier = 1 - ($maxDiscount / 100);

                $query->whereNotNull('compare_price')
                    ->whereColumn('compare_price', '>', 'price')
                    ->whereRaw('price <= compare_price * ?', [$lowerMultiplier]);

                // Only apply upper bound if not open-ended (70%+)
                if ($maxDiscount < 100) {
                    $query->whereRaw('price > compare_price * ?', [$upperMultiplier]);
                }

                $filters['min_discount'] = $minDiscount;
                $filters['max_discount'] = $maxDiscount;
            }
        }

        // In stock filter
        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
            $filters['in_stock'] = true;
        }

        // Has any discount filter (quick filter)
        if ($request->boolean('has_discount')) {
            $query->whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price');
            $filters['has_discount'] = true;
        }

        // Rating filter (4 stars and up)
        if ($request->boolean('top_rated')) {
            $query->where('average_rating', '>=', 4);
            $filters['top_rated'] = true;
        }

        // Popular filter (most purchased)
        if ($request->boolean('popular')) {
            $query->where('times_purchased', '>', 0)
                ->orderBy('times_purchased', 'desc');
            $filters['popular'] = true;
        }

        // Has color options filter (products with color attribute)
        if ($request->boolean('has_colors')) {
            $query->whereNotNull('color');
            $filters['has_colors'] = true;
        }

        // Has size options filter (products with available_sizes)
        if ($request->boolean('has_sizes')) {
            $query->whereNotNull('available_sizes');
            $filters['has_sizes'] = true;
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
            'popular' => $query->orderBy('times_purchased', 'desc'),
            'top_rated' => $query->orderBy('average_rating', 'desc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $products = $query->paginate(12)->withQueryString();

        // Get subcategories - if viewing a subcategory, show siblings (parent's children)
        // If viewing a parent category, show its children
        $subcategories = $category->children()->active()->ordered()->get();
        $parentCategory = null;

        if ($subcategories->isEmpty() && $category->parent_id) {
            // This is a subcategory - get siblings from parent
            $parentCategory = $category->parent;
            $subcategories = Category::where('parent_id', $category->parent_id)
                ->active()
                ->ordered()
                ->get();
        }

        // Get price range for the filter UI
        $priceRange = Product::whereIn('category_id', $categoryIds)
            ->active()
            ->selectRaw('MIN(price) as min, MAX(price) as max')
            ->first();

        // Count products with color options in this category
        $productsWithColors = Product::whereIn('category_id', $categoryIds)
            ->active()
            ->whereNotNull('color')
            ->count();

        // Count products with size options in this category
        $productsWithSizes = Product::whereIn('category_id', $categoryIds)
            ->active()
            ->whereNotNull('available_sizes')
            ->count();

        // Get available discount brackets in this category
        // Using ranges like [10%, 20%), [20%, 30%), etc. to avoid gaps
        // Display labels show "10-19%", "20-29%" but actual filter is [10%, 20%)
        $discountRanges = [
            ['min' => 10, 'max' => 20, 'label_max' => 19],
            ['min' => 20, 'max' => 30, 'label_max' => 29],
            ['min' => 30, 'max' => 40, 'label_max' => 39],
            ['min' => 40, 'max' => 50, 'label_max' => 49],
            ['min' => 50, 'max' => 60, 'label_max' => 59],
            ['min' => 60, 'max' => 70, 'label_max' => 69],
            ['min' => 70, 'max' => 100, 'label_max' => 100], // 70%+ for anything 70 and above
        ];
        $availableDiscountBrackets = [];

        foreach ($discountRanges as $range) {
            // discount % = (compare_price - price) / compare_price * 100
            // Rearranged: price = compare_price * (1 - discount/100)
            // For range [min, max): min <= discount < max
            // Lower bound (min discount): price <= compare_price * (1 - min/100)
            // Upper bound (max discount): price > compare_price * (1 - max/100)
            $lowerMultiplier = 1 - ($range['min'] / 100);
            $upperMultiplier = 1 - ($range['max'] / 100);

            $query = Product::whereIn('category_id', $categoryIds)
                ->active()
                ->whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price');

            // Range [min%, max%) - inclusive lower, exclusive upper
            $query->whereRaw('price <= compare_price * ?', [$lowerMultiplier]);

            if ($range['max'] < 100) {
                // Normal range: apply upper bound (exclusive)
                $query->whereRaw('price > compare_price * ?', [$upperMultiplier]);
            }
            // For 70%+, no upper bound

            $count = $query->count();

            if ($count > 0) {
                $availableDiscountBrackets[] = [
                    'min' => $range['min'],
                    'max' => $range['max'], // Actual filter max (exclusive upper bound)
                    'label_max' => $range['label_max'], // Display label max (e.g., 19 for "10-19%")
                    'count' => $count,
                ];
            }
        }

        // Also get max discount for backward compatibility
        $maxDiscount = Product::whereIn('category_id', $categoryIds)
            ->active()
            ->whereNotNull('compare_price')
            ->whereColumn('compare_price', '>', 'price')
            ->toBase()
            ->selectRaw('MAX(((compare_price - price) * 1.0) / compare_price * 100) as max_discount')
            ->value('max_discount');

        $maxDiscount = (float) ($maxDiscount ?? 0);

        return Inertia::render('Shop/Category', [
            'category' => $category,
            'products' => $products,
            'subcategories' => $subcategories,
            'parentCategory' => $parentCategory,
            'sort' => $sort,
            'filters' => $filters,
            'priceRange' => [
                'min' => (float) ($priceRange->min ?? 0),
                'max' => (float) ($priceRange->max ?? 0),
            ],
            'productsWithColors' => $productsWithColors,
            'productsWithSizes' => $productsWithSizes,
            'maxDiscount' => $maxDiscount,
            'availableDiscountBrackets' => $availableDiscountBrackets,
        ]);
    }
}
