<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function confirmation(Order $order): Response
    {
        // Allow access if user owns the order or order was just created (session check)
        $user = auth()->user();
        if ($user && $order->user_id !== $user->id) {
            abort(403);
        }

        $order->load('items');

        return Inertia::render('Shop/OrderConfirmation', [
            'order' => $order,
        ]);
    }

    public function index(Request $request): Response
    {
        $orders = $request->user()
            ->orders()
            ->with('items')
            ->recent()
            ->paginate(10);

        return Inertia::render('Shop/OrderHistory', [
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        // Ensure user owns this order
        if ($order->user_id !== $request->user()->id) {
            abort(403);
        }

        $order->load('items.product');

        return Inertia::render('Shop/OrderDetail', [
            'order' => $order,
        ]);
    }
}
