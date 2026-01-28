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

        // Pagination
        $perPage = in_array($request->per_page, ['10', '15', '25', '50', '100'])
            ? (int) $request->per_page
            : 15;

        $coupons = $query->orderBy('created_at', 'desc')->paginate($perPage);

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

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons,
            'filters' => $request->only(['search', 'status', 'type', 'per_page']),
            'statusCounts' => $statusCounts,
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

    public function toggleActive(Coupon $coupon): RedirectResponse
    {
        $coupon->update(['is_active' => !$coupon->is_active]);

        $status = $coupon->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Coupon {$status} successfully.");
    }
}
