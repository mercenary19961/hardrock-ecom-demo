<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ReportsController extends Controller
{
    public function index(Request $request): Response
    {
        $range = $request->get('range', '30'); // Default to 30 days
        $startDate = $this->getStartDate($range);
        $endDate = Carbon::now();

        // Revenue data over time
        $revenueOverTime = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($item) => [
                'date' => $item->date,
                'revenue' => (float) $item->revenue,
                'orders' => (int) $item->orders,
            ]);

        // Revenue summary
        $revenueSummary = [
            'total' => Order::where('status', '!=', 'cancelled')
                ->where('created_at', '>=', $startDate)
                ->sum('total'),
            'average' => Order::where('status', '!=', 'cancelled')
                ->where('created_at', '>=', $startDate)
                ->avg('total') ?? 0,
            'orders' => Order::where('created_at', '>=', $startDate)->count(),
            'completed_orders' => Order::where('status', 'delivered')
                ->where('created_at', '>=', $startDate)
                ->count(),
        ];

        // Orders by status
        $ordersByStatus = Order::where('created_at', '>=', $startDate)
            ->selectRaw('status, COUNT(*) as count, SUM(total) as revenue')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($item) => [
                $item->status => [
                    'count' => (int) $item->count,
                    'revenue' => (float) $item->revenue,
                ]
            ]);

        // Top selling products
        $topProducts = Product::select('products.id', 'products.name', 'products.name_ar', 'products.sku', 'products.price', 'products.times_purchased')
            ->orderByDesc('times_purchased')
            ->take(10)
            ->get();

        // Top rated products
        $topRatedProducts = Product::select('products.id', 'products.name', 'products.name_ar', 'products.average_rating', 'products.rating_count')
            ->where('rating_count', '>=', 3) // At least 3 reviews
            ->orderByDesc('average_rating')
            ->orderByDesc('rating_count')
            ->take(10)
            ->get();

        // Customer stats
        $customerStats = [
            'total' => User::where('role', 'customer')->count(),
            'new' => User::where('role', 'customer')
                ->where('created_at', '>=', $startDate)
                ->count(),
            'with_orders' => User::where('role', 'customer')
                ->whereHas('orders')
                ->count(),
            'repeat_customers' => User::where('role', 'customer')
                ->whereHas('orders', function ($q) {
                    $q->select(DB::raw('user_id'))
                        ->groupBy('user_id')
                        ->havingRaw('COUNT(*) > 1');
                })
                ->count(),
        ];

        // Customers by orders (top spenders)
        $topCustomers = User::where('role', 'customer')
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->having('orders_count', '>', 0)
            ->orderByDesc('orders_sum_total')
            ->take(10)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'orders_count' => $user->orders_count,
                'total_spent' => (float) $user->orders_sum_total,
            ]);

        // Category performance
        $categoryPerformance = DB::table('products')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.id',
                'categories.name',
                'categories.name_ar',
                DB::raw('COUNT(products.id) as products_count'),
                DB::raw('SUM(products.times_purchased) as total_sold'),
                DB::raw('AVG(products.average_rating) as avg_rating')
            )
            ->where('products.is_active', true)
            ->groupBy('categories.id', 'categories.name', 'categories.name_ar')
            ->orderByDesc('total_sold')
            ->get();

        // Review stats
        $reviewStats = [
            'total' => Review::where('created_at', '>=', $startDate)->count(),
            'average_rating' => round(Review::where('created_at', '>=', $startDate)->avg('rating') ?? 0, 1),
            'verified_count' => Review::where('created_at', '>=', $startDate)
                ->where('is_verified_purchase', true)
                ->count(),
        ];

        // Inventory stats
        $inventoryStats = [
            'total_products' => Product::where('is_active', true)->count(),
            'total_stock' => Product::where('is_active', true)->sum('stock'),
            'total_value' => Product::where('is_active', true)
                ->selectRaw('SUM(price * stock) as total')
                ->value('total') ?? 0,
            'out_of_stock' => Product::where('is_active', true)->where('stock', 0)->count(),
            'low_stock' => Product::where('is_active', true)
                ->where('stock', '>', 0)
                ->where('stock', '<=', (int) Setting::get('low_stock_threshold', 10))
                ->count(),
        ];

        return Inertia::render('Admin/Reports/Index', [
            'range' => $range,
            'revenueOverTime' => $revenueOverTime,
            'revenueSummary' => $revenueSummary,
            'ordersByStatus' => $ordersByStatus,
            'topProducts' => $topProducts,
            'topRatedProducts' => $topRatedProducts,
            'customerStats' => $customerStats,
            'topCustomers' => $topCustomers,
            'categoryPerformance' => $categoryPerformance,
            'reviewStats' => $reviewStats,
            'inventoryStats' => $inventoryStats,
        ]);
    }

    private function getStartDate(string $range): Carbon
    {
        return match ($range) {
            '7' => Carbon::now()->subDays(7),
            '30' => Carbon::now()->subDays(30),
            '90' => Carbon::now()->subDays(90),
            '365' => Carbon::now()->subYear(),
            'all' => Carbon::create(2000, 1, 1),
            default => Carbon::now()->subDays(30),
        };
    }
}
