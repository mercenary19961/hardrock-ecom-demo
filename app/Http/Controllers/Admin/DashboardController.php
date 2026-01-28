<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    public function index(Request $request): Response
    {
        // Get date range from query parameter (default: month)
        $range = $request->get('range', 'month');
        $dateRange = $this->getDateRange($range);

        // Get stats with trend indicators
        $stats = $this->getStatsWithTrends($dateRange, $range);

        // Recent orders (date-filtered)
        $recentOrders = Order::with('user')
            ->when($dateRange['start'], fn ($q) => $q->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]))
            ->recent()
            ->take(5)
            ->get();

        // Orders by status (date-filtered)
        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->when($dateRange['start'], fn ($q) => $q->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Revenue by status (date-filtered)
        $revenueByStatus = Order::select('status', DB::raw('SUM(total) as revenue'))
            ->when($dateRange['start'], fn ($q) => $q->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]))
            ->groupBy('status')
            ->get()
            ->pluck('revenue', 'status')
            ->map(fn ($v) => (float) $v);

        // Low stock products (not date-filtered - current inventory status)
        $lowStockProducts = Product::with('category')
            ->where('stock', '>', 0)
            ->whereRaw('stock <= COALESCE(products.low_stock_threshold, (SELECT low_stock_threshold FROM categories WHERE categories.id = products.category_id), 10)')
            ->orderBy('stock')
            ->take(5)
            ->get();

        // Top selling products (date-filtered by orders)
        $topSellingProducts = $this->getTopSellingProducts($dateRange);

        // Get recent activities (25 for drawer, display 5 in widget)
        $recentActivities = $this->activityLogService->getRecentActivities(25);

        return Inertia::render('Admin/Dashboard', [
            'selectedRange' => $range,
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'ordersByStatus' => $ordersByStatus,
            'revenueByStatus' => $revenueByStatus,
            'lowStockProducts' => $lowStockProducts,
            'topSellingProducts' => $topSellingProducts,
            'recentActivities' => $recentActivities,

            // Active coupons
            'activeCoupons' => Coupon::valid()
                ->select('id', 'code', 'name', 'type', 'value', 'usage_count', 'usage_limit', 'expires_at')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(),

            // Deferred props for heavier queries
            'chartData' => Inertia::defer(fn () => $this->getChartData($dateRange, $range), 'chart'),
            'recentReviews' => Inertia::defer(fn () => $this->getRecentReviews(), 'reviews'),
        ]);
    }

    /**
     * Get date range boundaries based on selected range
     */
    private function getDateRange(string $range): array
    {
        return match ($range) {
            'today' => [
                'start' => now()->startOfDay(),
                'end' => now()->endOfDay(),
                'previous_start' => now()->subDay()->startOfDay(),
                'previous_end' => now()->subDay()->endOfDay(),
            ],
            'week' => [
                'start' => now()->startOfWeek(),
                'end' => now()->endOfWeek(),
                'previous_start' => now()->subWeek()->startOfWeek(),
                'previous_end' => now()->subWeek()->endOfWeek(),
            ],
            'month' => [
                'start' => now()->startOfMonth(),
                'end' => now()->endOfMonth(),
                'previous_start' => now()->subMonth()->startOfMonth(),
                'previous_end' => now()->subMonth()->endOfMonth(),
            ],
            default => [ // 'all'
                'start' => null,
                'end' => null,
                'previous_start' => null,
                'previous_end' => null,
            ],
        };
    }

    /**
     * Get stats with trend indicators comparing current vs previous period
     */
    private function getStatsWithTrends(array $dateRange, string $range): array
    {
        $cacheKey = 'dashboard_stats_' . $range . '_' . now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, 600, function () use ($dateRange) {
            // Current period stats
            $current = $this->computeStats($dateRange['start'], $dateRange['end']);

            // Previous period stats (for comparison)
            $previous = $dateRange['previous_start']
                ? $this->computeStats($dateRange['previous_start'], $dateRange['previous_end'])
                : null;

            return $this->addTrends($current, $previous);
        });
    }

    /**
     * Compute stats for a given date range
     */
    private function computeStats(?Carbon $start, ?Carbon $end): array
    {
        $orderQuery = Order::query();
        $customerQuery = User::where('role', 'customer');

        if ($start && $end) {
            $orderQuery->whereBetween('created_at', [$start, $end]);
            $customerQuery->whereBetween('created_at', [$start, $end]);
        }

        return [
            'total_products' => Product::count(), // Products not date-filtered
            'total_categories' => Category::count(), // Categories not date-filtered
            'total_orders' => (clone $orderQuery)->count(),
            'total_customers' => $customerQuery->count(),
            'revenue' => (clone $orderQuery)->where('status', '!=', 'cancelled')->sum('total'),
            'pending_orders' => (clone $orderQuery)->where('status', 'pending')->count(),
            'out_of_stock' => Product::where('is_active', true)->where('stock', 0)->count(), // Not date-filtered
        ];
    }

    /**
     * Add trend indicators to stats
     */
    private function addTrends(array $current, ?array $previous): array
    {
        $result = [];

        foreach ($current as $key => $value) {
            // For non-date-sensitive stats, don't show trends
            if (in_array($key, ['total_products', 'total_categories', 'out_of_stock'])) {
                $result[$key] = [
                    'value' => $value,
                    'trend' => null,
                    'percentage' => null,
                ];
                continue;
            }

            if (!$previous) {
                $result[$key] = [
                    'value' => $value,
                    'trend' => null,
                    'percentage' => null,
                ];
                continue;
            }

            $prevValue = $previous[$key] ?? 0;

            if ($prevValue > 0) {
                $change = (($value - $prevValue) / $prevValue) * 100;
                $result[$key] = [
                    'value' => $value,
                    'trend' => $change > 0 ? 'up' : ($change < 0 ? 'down' : 'neutral'),
                    'percentage' => abs(round($change, 1)),
                ];
            } else {
                // Previous was 0
                $result[$key] = [
                    'value' => $value,
                    'trend' => $value > 0 ? 'up' : 'neutral',
                    'percentage' => $value > 0 ? 100 : null,
                ];
            }
        }

        return $result;
    }

    /**
     * Get top selling products (by order items in date range)
     */
    private function getTopSellingProducts(array $dateRange): \Illuminate\Support\Collection
    {
        if ($dateRange['start']) {
            // Get top products by order items in date range using subquery approach
            // to avoid MySQL ONLY_FULL_GROUP_BY strict mode issues
            $salesData = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->whereBetween('orders.created_at', [$dateRange['start'], $dateRange['end']])
                ->where('orders.status', '!=', 'cancelled')
                ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as period_sales'))
                ->groupBy('order_items.product_id')
                ->orderByDesc('period_sales')
                ->take(5)
                ->get();

            $productIds = $salesData->pluck('product_id');
            $salesMap = $salesData->pluck('period_sales', 'product_id');

            return Product::whereIn('id', $productIds)
                ->get()
                ->map(function ($product) use ($salesMap) {
                    // Use times_purchased field to store period sales for frontend consistency
                    $product->times_purchased = (int) ($salesMap[$product->id] ?? 0);
                    return $product;
                })
                ->sortByDesc('times_purchased')
                ->values();
        }

        // All-time: use times_purchased
        return Product::where('is_active', true)
            ->where('times_purchased', '>', 0)
            ->orderBy('times_purchased', 'desc')
            ->take(5)
            ->get();
    }

    /**
     * Get chart data for revenue and orders over time
     */
    private function getChartData(array $dateRange, string $range): array
    {
        $cacheKey = 'dashboard_chart_' . $range . '_' . now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, 600, function () use ($dateRange, $range) {
            // Determine how many days to show
            $days = match ($range) {
                'today' => 1,
                'week' => 7,
                'month' => 30,
                default => 30, // 'all' shows last 30 days
            };

            $startDate = $dateRange['start'] ?? now()->subDays($days);

            $data = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(CASE WHEN status != "cancelled" THEN total ELSE 0 END) as revenue')
            )
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return $data->map(fn ($row) => [
                'date' => $row->date,
                'orders' => (int) $row->orders,
                'revenue' => (float) $row->revenue,
            ])->toArray();
        });
    }

    /**
     * Get recent reviews
     */
    private function getRecentReviews(): array
    {
        return Review::with(['product:id,name,slug', 'user:id,name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'comment' => $review->comment ? Str::limit($review->comment, 100) : null,
                'product_name' => $review->product?->name ?? 'Unknown Product',
                'product_slug' => $review->product?->slug ?? '',
                'user_name' => $review->user?->name ?? 'Anonymous',
                'created_at' => $review->created_at->toISOString(),
            ])
            ->toArray();
    }
}
