<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Order::with('user');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $perPage = in_array($request->per_page, ['10', '15', '25', '50', '100'])
            ? (int) $request->per_page
            : 15;

        $orders = $query->recent()->paginate($perPage)->withQueryString();

        $statusCounts = Order::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['items.product', 'user']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
        ]);

        $order->update(['status' => $request->status]);

        return back()->with('success', 'Order status updated successfully.');
    }
}
