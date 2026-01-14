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

        // Extract filter/sort params for use in closures
        $sort = $request->get('sort', 'newest');
        $filters = $this->extractFilters($request);

        // Get subcategories - fast query for page structure
        $subcategories = $category->children()->active()->ordered()->get();
        $parentCategory = null;

        if ($subcategories->isEmpty() && $category->parent_id) {
            $parentCategory = $category->parent;
            $subcategories = Category::where('parent_id', $category->parent_id)
                ->active()
                ->ordered()
                ->get();
        }

        return Inertia::render('Shop/Category', [
            // Immediate props - for page structure (renders instantly)
            'category' => $category,
            'subcategories' => $subcategories,
            'parentCategory' => $parentCategory,
            'sort' => $sort,
            'filters' => $filters,

            // Deferred: Products - main content loads after initial render
            'products' => Inertia::defer(
                fn () => $this->getFilteredProducts($categoryIds, $filters, $sort),
                'products'
            ),

            // Deferred: Filter metadata - loads in parallel with products
            'priceRange' => Inertia::defer(
                fn () => $this->getPriceRange($categoryIds),
                'filterMeta'
            ),
            'productsWithColors' => Inertia::defer(
                fn () => $this->getProductsWithColors($categoryIds),
                'filterMeta'
            ),
            'productsWithSizes' => Inertia::defer(
                fn () => $this->getProductsWithSizes($categoryIds),
                'filterMeta'
            ),
            'maxDiscount' => Inertia::defer(
                fn () => $this->getMaxDiscount($categoryIds),
                'filterMeta'
            ),
            'availableDiscountBrackets' => Inertia::defer(
                fn () => $this->getDiscountBrackets($categoryIds),
                'filterMeta'
            ),
        ]);
    }

    /**
     * Extract filter parameters from request
     */
    private function extractFilters(Request $request): array
    {
        $filters = [];

        if ($request->boolean('new_arrivals')) {
            $filters['new_arrivals'] = true;
        }
        if ($request->boolean('below_100')) {
            $filters['below_100'] = true;
        }
        if ($request->filled('price_range')) {
            $filters['price_range'] = $request->get('price_range');
        }
        if ($request->filled('min_price')) {
            $filters['min_price'] = (float) $request->get('min_price');
        }
        if ($request->filled('max_price')) {
            $filters['max_price'] = (float) $request->get('max_price');
        }
        if ($request->filled('min_discount')) {
            $filters['min_discount'] = (int) $request->get('min_discount');
            $filters['max_discount'] = $request->filled('max_discount')
                ? (int) $request->get('max_discount')
                : 100;
        }
        if ($request->boolean('in_stock')) {
            $filters['in_stock'] = true;
        }
        if ($request->boolean('has_discount')) {
            $filters['has_discount'] = true;
        }
        if ($request->boolean('top_rated')) {
            $filters['top_rated'] = true;
        }
        if ($request->boolean('popular')) {
            $filters['popular'] = true;
        }
        if ($request->boolean('has_colors')) {
            $filters['has_colors'] = true;
        }
        if ($request->boolean('has_sizes')) {
            $filters['has_sizes'] = true;
        }

        return $filters;
    }

    /**
     * Get filtered and sorted products
     */
    private function getFilteredProducts(array $categoryIds, array $filters, string $sort)
    {
        $query = Product::with(['images'])
            ->whereIn('category_id', $categoryIds)
            ->active();

        // Apply filters
        if (!empty($filters['new_arrivals'])) {
            $thirtyDaysAgo = Carbon::now()->subDays(30);
            $sixtyDaysAgo = Carbon::now()->subDays(60);

            $recentCount = Product::whereIn('category_id', $categoryIds)
                ->active()
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            if ($recentCount > 0) {
                $query->where('created_at', '>=', $thirtyDaysAgo);
            } else {
                $extendedCount = Product::whereIn('category_id', $categoryIds)
                    ->active()
                    ->where('created_at', '>=', $sixtyDaysAgo)
                    ->count();

                if ($extendedCount > 0) {
                    $query->where('created_at', '>=', $sixtyDaysAgo);
                } else {
                    $query->orderBy('created_at', 'desc');
                }
            }
        }

        if (!empty($filters['below_100'])) {
            $query->where('price', '<', 100);
        }

        if (!empty($filters['price_range'])) {
            match ($filters['price_range']) {
                'under_25' => $query->where('price', '<=', 25),
                '25_to_50' => $query->where('price', '>', 25)->where('price', '<=', 50),
                'over_50' => $query->where('price', '>', 50),
                default => null,
            };
        }

        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        if (!empty($filters['min_discount'])) {
            $minDiscount = $filters['min_discount'];
            $maxDiscount = $filters['max_discount'] ?? 100;

            if ($minDiscount > 0 && $minDiscount <= 100) {
                $lowerMultiplier = 1 - ($minDiscount / 100);
                $upperMultiplier = 1 - ($maxDiscount / 100);

                $query->whereNotNull('compare_price')
                    ->whereColumn('compare_price', '>', 'price')
                    ->whereRaw('price <= compare_price * ?', [$lowerMultiplier]);

                if ($maxDiscount < 100) {
                    $query->whereRaw('price > compare_price * ?', [$upperMultiplier]);
                }
            }
        }

        if (!empty($filters['in_stock'])) {
            $query->where('stock', '>', 0);
        }

        if (!empty($filters['has_discount'])) {
            $query->whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price');
        }

        if (!empty($filters['top_rated'])) {
            $query->where('average_rating', '>=', 4);
        }

        if (!empty($filters['popular'])) {
            $query->where('times_purchased', '>', 0)
                ->orderBy('times_purchased', 'desc');
        }

        if (!empty($filters['has_colors'])) {
            $query->whereNotNull('color');
        }

        if (!empty($filters['has_sizes'])) {
            $query->whereNotNull('available_sizes');
        }

        // Apply sorting
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

        return $query->paginate(12)->withQueryString();
    }

    /**
     * Get price range for category
     */
    private function getPriceRange(array $categoryIds): array
    {
        $categoryIdList = implode(',', $categoryIds);
        $result = DB::selectOne("
            SELECT MIN(price) as min_price, MAX(price) as max_price
            FROM products
            WHERE category_id IN ({$categoryIdList}) AND is_active = 1
        ");

        return [
            'min' => (float) ($result->min_price ?? 0),
            'max' => (float) ($result->max_price ?? 0),
        ];
    }

    /**
     * Get count of products with colors
     */
    private function getProductsWithColors(array $categoryIds): int
    {
        return Product::whereIn('category_id', $categoryIds)
            ->active()
            ->whereNotNull('color')
            ->where('color', '!=', '')
            ->count();
    }

    /**
     * Get count of products with sizes
     */
    private function getProductsWithSizes(array $categoryIds): int
    {
        return Product::whereIn('category_id', $categoryIds)
            ->active()
            ->whereNotNull('available_sizes')
            ->count();
    }

    /**
     * Get maximum discount percentage in category
     */
    private function getMaxDiscount(array $categoryIds): float
    {
        $categoryIdList = implode(',', $categoryIds);
        $result = DB::selectOne("
            SELECT MAX(CASE WHEN compare_price > price
                THEN ((compare_price - price) * 100.0 / compare_price)
                ELSE 0 END) as max_discount
            FROM products
            WHERE category_id IN ({$categoryIdList}) AND is_active = 1
        ");

        return (float) ($result->max_discount ?? 0);
    }

    /**
     * Get available discount brackets with counts
     */
    private function getDiscountBrackets(array $categoryIds): array
    {
        $maxDiscount = $this->getMaxDiscount($categoryIds);

        if ($maxDiscount < 10) {
            return [];
        }

        $categoryIdList = implode(',', $categoryIds);
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

        $availableDiscountBrackets = [];
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

        return $availableDiscountBrackets;
    }
}
