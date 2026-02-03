<?php

namespace App\Http\Controllers\Admin;

use App\Exports\UsersExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        // Calculate stats for the dashboard cards
        $thirtyDaysAgo = now()->subDays(30);
        $stats = [
            'total' => $roleCounts['all'],
            'admins' => $roleCounts['admin'],
            'customers' => $roleCounts['customer'],
            'verified' => User::whereNotNull('email_verified_at')->count(),
            'unverified' => User::whereNull('email_verified_at')->count(),
            'new_users' => User::where('created_at', '>=', $thirtyDaysAgo)->count(),
        ];

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDir = $request->input('dir', 'desc');

        // Map frontend field names to database columns
        $sortableFields = [
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'role' => 'role',
            'created_at' => 'created_at',
        ];

        $sortColumn = $sortableFields[$sortField] ?? 'created_at';
        $sortDirection = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'desc';

        // Pagination
        $perPage = $request->input('per_page', 16);
        $users = $query->orderBy($sortColumn, $sortDirection)
                       ->paginate($perPage)
                       ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            // Cast to object to ensure JSON serializes as {} not [] when empty
            'filters' => (object) $request->only(['search', 'role', 'per_page', 'sort', 'dir']),
            'roleCounts' => $roleCounts,
            'stats' => $stats,
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

    /**
     * Export users to various formats (CSV, Excel, JSON)
     */
    public function export(Request $request): StreamedResponse|BinaryFileResponse
    {
        $format = $request->input('format', 'csv');
        $timestamp = now()->format('Y-m-d_His');

        // Build query with same filters as index
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

        // Specific user IDs (for selected export)
        if ($request->has('user_ids')) {
            $userIds = $request->input('user_ids');
            if (!empty($userIds)) {
                $query->whereIn('id', $userIds);
            }
        }

        // Add aggregates for order stats
        $query->withCount('orders')
              ->withSum(['orders as total_spent' => function ($q) {
                  $q->where('status', 'delivered');
              }], 'total');

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDir = $request->input('dir', 'desc');

        $sortableFields = [
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'role' => 'role',
            'created_at' => 'created_at',
        ];

        $sortColumn = $sortableFields[$sortField] ?? 'created_at';
        $sortDirection = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'desc';

        $users = $query->orderBy($sortColumn, $sortDirection)->get();

        return match ($format) {
            'xlsx' => $this->exportExcel($users, $timestamp),
            'json' => $this->exportJson($users, $timestamp),
            default => $this->exportCsv($users, $timestamp),
        };
    }

    /**
     * Export users as CSV
     */
    private function exportCsv($users, string $timestamp): StreamedResponse
    {
        $filename = "users-{$timestamp}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($users) {
            $handle = fopen('php://output', 'w');

            // Add UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // Headers
            fputcsv($handle, [
                'ID',
                'Name',
                'Email',
                'Phone',
                'Role',
                'Email Verified',
                'Verified At',
                'Verified Via',
                'Total Orders',
                'Total Spent',
                'Created At',
            ]);

            // Data rows
            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->phone ?? '',
                    ucfirst($user->role),
                    $user->email_verified_at ? 'Yes' : 'No',
                    $user->email_verified_at?->format('Y-m-d H:i:s') ?? '',
                    $user->verified_via ?? '',
                    $user->orders_count ?? 0,
                    $user->total_spent ? number_format($user->total_spent, 2) : '0.00',
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export users as Excel (.xlsx)
     */
    private function exportExcel($users, string $timestamp): BinaryFileResponse
    {
        return Excel::download(
            new UsersExport($users),
            "users-{$timestamp}.xlsx"
        );
    }

    /**
     * Export users as JSON
     */
    private function exportJson($users, string $timestamp): StreamedResponse
    {
        $filename = "users-{$timestamp}.json";

        $headers = [
            'Content-Type' => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $data = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'email_verified' => (bool) $user->email_verified_at,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'verified_via' => $user->verified_via,
                'total_orders' => $user->orders_count ?? 0,
                'total_spent' => $user->total_spent ? (float) $user->total_spent : 0,
                'created_at' => $user->created_at->toISOString(),
            ];
        });

        return response()->stream(function () use ($data) {
            echo json_encode(['users' => $data], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, 200, $headers);
    }
}
