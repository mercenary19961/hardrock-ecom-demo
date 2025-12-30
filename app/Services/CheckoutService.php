<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function processCheckout(Cart $cart, array $data, ?User $user = null): Order
    {
        return DB::transaction(function () use ($cart, $data, $user) {
            $cart->load('items.product');

            if ($cart->isEmpty()) {
                throw new \Exception('Cart is empty');
            }

            // Calculate totals
            $subtotal = $cart->subtotal;
            $total = $subtotal;

            // Create order
            $order = Order::create([
                'user_id' => $user?->id,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => 0,
                'total' => $total,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'shipping_address' => [
                    'street' => $data['shipping_street'],
                    'city' => $data['shipping_city'],
                    'state' => $data['shipping_state'] ?? '',
                    'postal_code' => $data['shipping_postal_code'],
                    'country' => $data['shipping_country'],
                ],
                'billing_address' => isset($data['billing_same']) && $data['billing_same']
                    ? null
                    : [
                        'street' => $data['billing_street'] ?? '',
                        'city' => $data['billing_city'] ?? '',
                        'state' => $data['billing_state'] ?? '',
                        'postal_code' => $data['billing_postal_code'] ?? '',
                        'country' => $data['billing_country'] ?? '',
                    ],
                'notes' => $data['notes'] ?? null,
            ]);

            // Create order items
            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product->id,
                    'product_name' => $item->product->name,
                    'product_sku' => $item->product->sku,
                    'price' => $item->product->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                ]);

                // Decrease stock and increment times_purchased
                $item->product->decrement('stock', $item->quantity);
                $item->product->increment('times_purchased', $item->quantity);
            }

            // Clear cart
            $this->cartService->clear($cart);

            return $order->load('items');
        });
    }

    public function validateStock(Cart $cart): array
    {
        $errors = [];

        foreach ($cart->items as $item) {
            if ($item->quantity > $item->product->stock) {
                $errors[] = [
                    'product' => $item->product->name,
                    'requested' => $item->quantity,
                    'available' => $item->product->stock,
                ];
            }
        }

        return $errors;
    }
}
