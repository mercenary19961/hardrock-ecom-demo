<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        // Get counts for tabs
        $roleCounts = [
            'all' => User::count(),
            'admin' => User::where('role', 'admin')->count(),
            'customer' => User::where('role', 'customer')->count(),
        ];

        // Pagination
        $perPage = $request->input('per_page', 15);
        $users = $query->orderBy('created_at', 'desc')
                       ->paginate($perPage)
                       ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'per_page']),
            'roleCounts' => $roleCounts,
        ]);
    }

    public function show(User $user)
    {
        // Stats calculations
        $orders = $user->orders()->get();
        $deliveredOrders = $orders->where('status', 'delivered');

        $stats = [
            'total_orders' => $orders->count(),
            'completed_orders' => $deliveredOrders->count(),
            'total_spent' => (float) $deliveredOrders->sum('total'),
            'average_order' => $deliveredOrders->count() > 0
                ? round($deliveredOrders->sum('total') / $deliveredOrders->count(), 2)
                : 0,
            'highest_order' => (float) ($deliveredOrders->max('total') ?? 0),
            'total_savings' => (float) $orders->sum('discount'),
        ];

        // Order history with pagination
        $orderHistory = $user->orders()
            ->with('items')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Reviews with product info
        $reviews = $user->reviews()
            ->with(['product' => function ($query) {
                $query->select('id', 'name', 'name_ar', 'slug')->with('images');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        $reviewStats = [
            'total_reviews' => $reviews->count(),
            'average_rating' => $reviews->count() > 0
                ? round($reviews->avg('rating'), 1)
                : 0,
        ];

        // Most purchased products (top 5)
        $mostPurchased = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $user->id)
            ->where('orders.status', 'delivered')
            ->whereNotNull('order_items.product_id')
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_quantity'))
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_quantity')
            ->take(5)
            ->get();

        $productIds = $mostPurchased->pluck('product_id');
        $quantityMap = $mostPurchased->pluck('total_quantity', 'product_id');

        $topProducts = Product::whereIn('id', $productIds)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'name_ar' => $p->name_ar,
                'slug' => $p->slug,
                'image' => $p->getPrimaryImageUrl(),
                'times_purchased' => (int) $quantityMap[$p->id],
            ])
            ->sortByDesc('times_purchased')
            ->values();

        // Last order date
        $lastOrder = $user->orders()->latest()->first();

        // Active cart items
        $cartItemsCount = $user->cart?->items()->count() ?? 0;

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'stats' => $stats,
            'orderHistory' => $orderHistory,
            'reviews' => $reviews,
            'reviewStats' => $reviewStats,
            'topProducts' => $topProducts,
            'lastOrderDate' => $lastOrder?->created_at,
            'cartItemsCount' => $cartItemsCount,
        ]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->validated());

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function sendResetEmail(User $user)
    {
        // Send the password reset link
        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('success', 'Password reset link sent to ' . $user->email);
        }

        return back()->withErrors(['email' => __($status)]);
    }

    public function sendVerificationEmail(User $user)
    {
        if ($user->hasVerifiedEmail()) {
            return back()->with('info', 'This user\'s email is already verified.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Verification email sent to ' . $user->email);
    }

    public function destroy(User $user)
    {
        // Prevent deleting admins
        if ($user->isAdmin()) {
            return back()->withErrors(['error' => 'Admin users cannot be deleted.']);
        }

        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot delete yourself.']);
        }

        $user->delete(); // Soft delete

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }
}
