<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Requests\Admin\UpdateCouponRequest;
use App\Models\Coupon;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Coupon::query();

        // Search by code or name
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('code', 'like', '%' . $searchTerm . '%')
                  ->orWhere('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('name_ar', 'like', '%' . $searchTerm . '%');
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            switch ($request->status) {
                case 'active':
                    $query->where('is_active', true)
                        ->where(function ($q) {
                            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                        })
                        ->where(function ($q) {
                            $q->whereNull('usage_limit')->orWhereColumn('usage_count', '<', 'usage_limit');
                        });
                    break;
                case 'inactive':
                    $query->where('is_active', false);
                    break;
                case 'expired':
                    $query->where(function ($q) {
                        $q->where('expires_at', '<=', now())
                          ->orWhere(function ($q2) {
                              $q2->whereNotNull('usage_limit')
                                 ->whereColumn('usage_count', '>=', 'usage_limit');
                          });
                    });
                    break;
            }
        }

        // Filter by type
        if ($request->filled('type') && in_array($request->type, ['percentage', 'fixed'])) {
            $query->where('type', $request->type);
        }

        // Filter by started status
        if ($request->filled('started')) {
            switch ($request->started) {
                case 'started':
                    // Coupons that have started (no start date OR start date is in the past)
                    $query->where(function ($q) {
                        $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                    });
                    break;
                case 'not_started':
                    // Coupons that haven't started yet (start date is in the future)
                    $query->whereNotNull('starts_at')->where('starts_at', '>', now());
                    break;
            }
        }

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDir = $request->input('dir', 'desc');

        // Validate sort field
        $allowedSortFields = ['code', 'name', 'type', 'value', 'usage_count', 'expires_at', 'created_at', 'is_active'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        // Validate sort direction
        if (!in_array($sortDir, ['asc', 'desc'])) {
            $sortDir = 'desc';
        }

        // Apply sorting
        $query->orderBy($sortField, $sortDir);

        // Pagination
        $perPage = in_array($request->per_page, ['4', '8', '16', '32', '64', '80'])
            ? (int) $request->per_page
            : 16;

        $coupons = $query->paginate($perPage);

        // Get status counts
        $statusCounts = [
            'all' => Coupon::count(),
            'active' => Coupon::where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->where(function ($q) {
                    $q->whereNull('usage_limit')->orWhereColumn('usage_count', '<', 'usage_limit');
                })
                ->count(),
            'inactive' => Coupon::where('is_active', false)->count(),
            'expired' => Coupon::where(function ($q) {
                $q->where('expires_at', '<=', now())
                  ->orWhere(function ($q2) {
                      $q2->whereNotNull('usage_limit')
                         ->whereColumn('usage_count', '>=', 'usage_limit');
                  });
            })->count(),
        ];

        // Calculate stats for the dashboard cards
        $stats = [
            'total' => $statusCounts['all'],
            'active' => $statusCounts['active'],
            'expired' => $statusCounts['expired'],
            'total_uses' => Coupon::sum('usage_count'),
            'total_savings' => Order::whereNotNull('coupon_id')->sum('discount'),
        ];

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons,
            // Cast to object to ensure JSON serializes as {} not [] when empty
            'filters' => (object) $request->only(['search', 'status', 'type', 'started', 'per_page', 'sort', 'dir']),
            'statusCounts' => $statusCounts,
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Coupons/Create');
    }

    public function store(StoreCouponRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Uppercase the code
        $data['code'] = strtoupper($data['code']);

        Coupon::create($data);

        return redirect()
            ->route('admin.coupons.index')
            ->with('success', 'Coupon created successfully.');
    }

    public function edit(Coupon $coupon): Response
    {
        // Get usage statistics
        $stats = [
            'usage_count' => $coupon->usage_count,
            'orders_count' => Order::where('coupon_id', $coupon->id)->count(),
            'total_discount' => Order::where('coupon_id', $coupon->id)->sum('discount'),
        ];

        return Inertia::render('Admin/Coupons/Edit', [
            'coupon' => $coupon,
            'stats' => $stats,
        ]);
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon): RedirectResponse
    {
        $data = $request->validated();

        // Uppercase the code
        $data['code'] = strtoupper($data['code']);

        // Ensure is_active is explicitly set
        $data['is_active'] = $request->boolean('is_active');

        $coupon->update($data);

        return redirect()
            ->route('admin.coupons.edit', $coupon)
            ->with('success', 'Coupon updated successfully.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        // Check if coupon has been used in orders
        $ordersCount = Order::where('coupon_id', $coupon->id)->count();

        if ($ordersCount > 0) {
            return back()->withErrors([
                'coupon' => "Cannot delete coupon that has been used in {$ordersCount} orders. Consider deactivating it instead.",
            ]);
        }

        $coupon->delete();

        return redirect()
            ->route('admin.coupons.index')
            ->with('success', 'Coupon deleted successfully.');
    }

    public function toggleActive(Request $request, Coupon $coupon)
    {
        $coupon->update(['is_active' => !$coupon->is_active]);

        $status = $coupon->is_active ? 'activated' : 'deactivated';

        // Return JSON for AJAX requests (non-Inertia)
        if (!$request->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'is_active' => $coupon->is_active,
                'message' => "Coupon {$status} successfully.",
            ]);
        }

        return back()->with('success', "Coupon {$status} successfully.");
    }
}
