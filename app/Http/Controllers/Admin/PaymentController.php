<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $query = Payment::with('order:id,order_number,total,payment_method,payment_status,customer_name')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('order', function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('provider')) {
            $query->where('provider', $request->input('provider'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $payments = $query->paginate(30)->withQueryString();

        // Convert minor units (halalas) → JOD for display
        $totalPaidHalalas = Payment::where('status', 'paid')->sum('amount');

        $stats = [
            'total_paid'    => number_format($totalPaidHalalas / 100, 2),
            'paid_count'    => Payment::where('status', 'paid')->count(),
            'failed_count'  => Payment::where('status', 'failed')->count(),
            'pending_count' => Payment::whereIn('status', ['initiated'])->count(),
        ];

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'filters'  => (object) $request->only(['search', 'status', 'provider', 'date_from', 'date_to']),
            'stats'    => $stats,
        ]);
    }
}
