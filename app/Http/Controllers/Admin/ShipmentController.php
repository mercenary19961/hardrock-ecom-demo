<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShipmentController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $query = Order::with('user:id,name,email')
            ->where(function ($q) {
                $q->whereNotNull('tracking_number')
                  ->orWhereNotNull('oto_id');
            })
            ->select([
                'id', 'order_number', 'status', 'carrier',
                'tracking_number', 'oto_id', 'shipping_label_url',
                'shipping_provider', 'shipping_fee', 'total',
                'customer_name', 'customer_email', 'user_id',
                'payment_method', 'updated_at', 'created_at',
            ])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('carrier')) {
            $query->where('carrier', $request->input('carrier'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $shipments = $query->paginate(30)->withQueryString();

        $base = Order::where(function ($q) {
            $q->whereNotNull('tracking_number')->orWhereNotNull('oto_id');
        });

        $stats = [
            'in_transit'  => (clone $base)->where('status', 'shipped')->count(),
            'delivered'   => (clone $base)->where('status', 'delivered')->count(),
            'cancelled'   => (clone $base)->where('status', 'cancelled')->count(),
            // Orders processing that have no tracking yet (pending fulfillment)
            'pending_fulfillment' => Order::where('status', 'processing')
                ->whereNull('tracking_number')
                ->whereNull('oto_id')
                ->count(),
        ];

        // Distinct carriers for filter dropdown
        $carriers = Order::whereNotNull('carrier')
            ->where('carrier', '!=', '')
            ->distinct()
            ->pluck('carrier')
            ->sort()
            ->values();

        return Inertia::render('Admin/Shipments/Index', [
            'shipments' => $shipments,
            'filters'   => (object) $request->only(['status', 'carrier', 'date_from', 'date_to']),
            'stats'     => $stats,
            'carriers'  => $carriers,
        ]);
    }
}
