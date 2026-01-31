<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class OrderController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $query = Order::with('user');

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Payment status filter
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Date preset filter (today, week, month)
        if ($request->filled('date_preset')) {
            switch ($request->date_preset) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', today()->subDay());
                    break;
                case 'week':
                    $query->whereDate('created_at', '>=', now()->startOfWeek());
                    break;
                case 'month':
                    $query->whereDate('created_at', '>=', now()->startOfMonth());
                    break;
            }
        }

        $perPage = in_array($request->per_page, ['10', '15', '25', '50', '100'])
            ? (int) $request->per_page
            : 15;

        $orders = $query->recent()->paginate($perPage)->withQueryString();

        // Status counts
        $statusCounts = Order::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Payment status counts
        $paymentStatusCounts = Order::selectRaw('payment_status, count(*) as count')
            ->groupBy('payment_status')
            ->pluck('count', 'payment_status');

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'statusCounts' => $statusCounts,
            'paymentStatusCounts' => $paymentStatusCounts,
            // Cast to object to ensure JSON serializes as {} not [] when empty
            'filters' => (object) $request->only(['search', 'status', 'payment_status', 'per_page', 'date_from', 'date_to', 'date_preset']),
        ]);
    }

    public function show(Order $order): InertiaResponse
    {
        $order->load(['items.product', 'user', 'coupon', 'activities.user']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:pending,processing,delivered,cancelled',
        ]);

        $oldStatus = $order->status;
        $newStatus = $request->status;

        if ($oldStatus !== $newStatus) {
            $order->update(['status' => $newStatus]);

            // Log the activity
            OrderActivity::logStatusChange($order, $oldStatus, $newStatus, Auth::id());
        }

        return back()->with('success', 'Order status updated successfully.');
    }

    public function updateTracking(Request $request, Order $order): RedirectResponse
    {
        $request->validate([
            'tracking_number' => 'nullable|string|max:100',
            'carrier' => 'nullable|string|max:100',
        ]);

        $order->update([
            'tracking_number' => $request->tracking_number,
            'carrier' => $request->carrier,
        ]);

        // Log the activity
        OrderActivity::logTrackingUpdate($order, $request->tracking_number, $request->carrier, Auth::id());

        return back()->with('success', 'Tracking information updated successfully.');
    }

    public function updateAdminNotes(Request $request, Order $order): RedirectResponse
    {
        $request->validate([
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        $oldNotes = $order->admin_notes;
        $newNotes = $request->admin_notes;

        $order->update(['admin_notes' => $newNotes]);

        // Log the activity only if notes were added/changed
        if ($newNotes && $newNotes !== $oldNotes) {
            OrderActivity::logAdminNote($order, $newNotes, Auth::id());
        }

        return back()->with('success', 'Admin notes updated successfully.');
    }

    public function bulkUpdateStatus(Request $request): RedirectResponse
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:orders,id',
            'status' => 'required|in:pending,processing,delivered,cancelled',
        ]);

        $orders = Order::whereIn('id', $request->order_ids)->get();
        $updatedCount = 0;

        foreach ($orders as $order) {
            if ($order->status !== $request->status) {
                $oldStatus = $order->status;
                $order->update(['status' => $request->status]);
                OrderActivity::logStatusChange($order, $oldStatus, $request->status, Auth::id());
                $updatedCount++;
            }
        }

        return back()->with('success', "{$updatedCount} order(s) updated successfully.");
    }

    public function export(Request $request): StreamedResponse
    {
        $query = Order::with('items');

        // Apply same filters as index
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

        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('date_preset')) {
            switch ($request->date_preset) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', today()->subDay());
                    break;
                case 'week':
                    $query->whereDate('created_at', '>=', now()->startOfWeek());
                    break;
                case 'month':
                    $query->whereDate('created_at', '>=', now()->startOfMonth());
                    break;
            }
        }

        // If specific IDs are provided (for selected export)
        if ($request->filled('order_ids')) {
            $query->whereIn('id', $request->order_ids);
        }

        $orders = $query->recent()->get();

        // Generate CSV
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="orders-' . now()->format('Y-m-d-His') . '.csv"',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');

            // Header row
            fputcsv($file, [
                'Order Number',
                'Date',
                'Customer Name',
                'Customer Email',
                'Customer Phone',
                'Status',
                'Payment Status',
                'Payment Method',
                'Subtotal',
                'Tax',
                'Discount',
                'Total',
                'Items Count',
                'Shipping Address',
                'Tracking Number',
                'Carrier',
                'Notes',
            ]);

            // Data rows
            foreach ($orders as $order) {
                $address = $order->shipping_address;
                $addressString = implode(', ', array_filter([
                    $address['area'] ?? '',
                    $address['street'] ?? '',
                    $address['building'] ?? '',
                ]));

                fputcsv($file, [
                    $order->order_number,
                    $order->created_at->format('Y-m-d H:i:s'),
                    $order->customer_name,
                    $order->customer_email,
                    $order->customer_phone,
                    $order->status,
                    $order->payment_status,
                    $order->payment_method,
                    number_format($order->subtotal, 2),
                    number_format($order->tax, 2),
                    number_format($order->discount ?? 0, 2),
                    number_format($order->total, 2),
                    $order->items->count(),
                    $addressString,
                    $order->tracking_number,
                    $order->carrier,
                    $order->notes,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function printInvoice(Order $order): InertiaResponse
    {
        $order->load(['items.product', 'user', 'coupon']);

        return Inertia::render('Admin/Orders/Invoice', [
            'order' => $order,
        ]);
    }
}
