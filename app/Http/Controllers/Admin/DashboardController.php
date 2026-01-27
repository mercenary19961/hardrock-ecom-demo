<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    public function index(): Response
    {
        $stats = [
            'total_products' => Product::count(),
            'total_categories' => Category::count(),
            'total_orders' => Order::count(),
            'total_customers' => User::where('role', 'customer')->count(),
            'revenue' => Order::where('status', '!=', 'cancelled')->sum('total'),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'out_of_stock' => Product::where('is_active', true)->where('stock', 0)->count(),
        ];

        $recentOrders = Order::with('user')
            ->recent()
            ->take(5)
            ->get();

        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $lowStockProducts = Product::with('category')
            ->where('stock', '>', 0)
            ->whereRaw('stock <= COALESCE(products.low_stock_threshold, (SELECT low_stock_threshold FROM categories WHERE categories.id = products.category_id), 10)')
            ->orderBy('stock')
            ->take(5)
            ->get();

        $topSellingProducts = Product::where('is_active', true)
            ->where('times_purchased', '>', 0)
            ->orderBy('times_purchased', 'desc')
            ->take(5)
            ->get();

        // Get recent activities
        $recentActivities = $this->activityLogService->getRecentActivities(10);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'ordersByStatus' => $ordersByStatus,
            'lowStockProducts' => $lowStockProducts,
            'topSellingProducts' => $topSellingProducts,
            'recentActivities' => $recentActivities,
        ]);
    }
}
