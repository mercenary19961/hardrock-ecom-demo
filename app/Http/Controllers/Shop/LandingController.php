<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        // Eager load images (needed for product card image carousel on hover)
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

        // OPTIMIZED: Get all filter metadata in a SINGLE query
        // This replaces 4 separate queries (priceRange, productsWithColors, productsWithSizes, discountedProducts)
        $categoryIdList = implode(',', $categoryIds);
        $filterStats = DB::selectOne("
            SELECT
                MIN(price) as min_price,
                MAX(price) as max_price,
                SUM(CASE WHEN color IS NOT NULL AND color != '' THEN 1 ELSE 0 END) as products_with_colors,
                SUM(CASE WHEN available_sizes IS NOT NULL THEN 1 ELSE 0 END) as products_with_sizes,
                MAX(CASE WHEN compare_price > price THEN ((compare_price - price) * 100.0 / compare_price) ELSE 0 END) as max_discount
            FROM products
            WHERE category_id IN ({$categoryIdList}) AND is_active = 1
        ");

        $priceRange = [
            'min' => (float) ($filterStats->min_price ?? 0),
            'max' => (float) ($filterStats->max_price ?? 0),
        ];
        $productsWithColors = (int) ($filterStats->products_with_colors ?? 0);
        $productsWithSizes = (int) ($filterStats->products_with_sizes ?? 0);
        $maxDiscount = (float) ($filterStats->max_discount ?? 0);

        // Get discount brackets - only if there are discounted products
        $availableDiscountBrackets = [];
        if ($maxDiscount >= 10) {
            // Single query to get discount bracket counts
            $bracketCounts = DB::select("
                SELECT
                    CASE
                        WHEN discount_pct >= 70 THEN 70
                        WHEN discount_pct >= 60 THEN 60
                        WHEN discount_pct >= 50 THEN 50
                        WHEN discount_pct >= 40 THEN 40
                        WHEN discount_pct >= 30 THEN 30
                        WHEN discount_pct >= 20 THEN 20
                        WHEN discount_pct >= 10 THEN 10
                        ELSE 0
                    END as bracket_min,
                    COUNT(*) as count
                FROM (
                    SELECT ((compare_price - price) * 100.0 / compare_price) as discount_pct
                    FROM products
                    WHERE category_id IN ({$categoryIdList})
                    AND is_active = 1
                    AND compare_price IS NOT NULL
                    AND compare_price > price
                ) as discounts
                WHERE discount_pct >= 10
                GROUP BY bracket_min
                ORDER BY bracket_min
            ");

            $discountRanges = [
                10 => ['min' => 10, 'max' => 20, 'label_max' => 19],
                20 => ['min' => 20, 'max' => 30, 'label_max' => 29],
                30 => ['min' => 30, 'max' => 40, 'label_max' => 39],
                40 => ['min' => 40, 'max' => 50, 'label_max' => 49],
                50 => ['min' => 50, 'max' => 60, 'label_max' => 59],
                60 => ['min' => 60, 'max' => 70, 'label_max' => 69],
                70 => ['min' => 70, 'max' => 100, 'label_max' => 100],
            ];

            foreach ($bracketCounts as $bracket) {
                $min = (int) $bracket->bracket_min;
                if (isset($discountRanges[$min])) {
                    $availableDiscountBrackets[] = [
                        'min' => $discountRanges[$min]['min'],
                        'max' => $discountRanges[$min]['max'],
                        'label_max' => $discountRanges[$min]['label_max'],
                        'count' => (int) $bracket->count,
                    ];
                }
            }
        }

        return Inertia::render('Shop/Category', [
            'category' => $category,
            'products' => $products,
            'subcategories' => $subcategories,
            'parentCategory' => $parentCategory,
            'sort' => $sort,
            'filters' => $filters,
            'priceRange' => $priceRange,
            'productsWithColors' => $productsWithColors,
            'productsWithSizes' => $productsWithSizes,
            'maxDiscount' => $maxDiscount,
            'availableDiscountBrackets' => $availableDiscountBrackets,
        ]);
    }
}
