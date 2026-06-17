<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected NotificationService $notificationService,
    ) {}

    public function processCheckout(Cart $cart, array $data, ?User $user = null, string $paymentMethod = 'cod'): Order
    {
        return DB::transaction(function () use ($cart, $data, $user, $paymentMethod) {
            $cart->load('items.product');

            if ($cart->isEmpty()) {
                throw new \Exception('Cart is empty');
            }

            // Calculate totals
            $subtotal = $cart->subtotal;
            $discount = 0;
            $couponId = null;
            $couponCode = null;

            // Apply coupon if present in session
            $appliedCoupon = session('applied_coupon');
            if ($appliedCoupon) {
                $coupon = Coupon::find($appliedCoupon['id']);
                if ($coupon && !$coupon->getValidationError($user, $subtotal)) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $couponId = $coupon->id;
                    $couponCode = $coupon->code;

                    // Increment coupon usage
                    $coupon->incrementUsage($user);

                    // Clear coupon from session
                    session()->forget('applied_coupon');
                }
            }

            $total = $subtotal - $discount;

            // Create order
            $order = Order::create([
                'user_id' => $user?->id,
                'coupon_id' => $couponId,
                'coupon_code' => $couponCode,
                'status' => 'pending',
                'payment_method' => $paymentMethod,
                'payment_provider' => in_array($paymentMethod, ['moyasar', 'tamara'], true) ? $paymentMethod : null,
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => 0,
                'discount' => $discount,
                'total' => $total,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? $user?->email,
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => [
                    'area' => $data['delivery_area'],
                    'street' => $data['delivery_street'] ?? '',
                    'building' => $data['delivery_building'] ?? '',
                    'delivery_notes' => $data['delivery_notes'] ?? '',
                ],
                'billing_address' => null,
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
                $previousStock = $item->product->stock;
                $item->product->decrement('stock', $item->quantity);
                $item->product->increment('times_purchased', $item->quantity);
                $item->product->refresh();
                $this->notificationService->checkAndNotifyLowStock($item->product, $previousStock);
            }

            // Clear cart
            $this->cartService->clear($cart);

            $loaded = $order->load('items');
            $this->notificationService->notifyNewOrder($loaded);

            return $loaded;
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

    /**
     * Return reserved stock to inventory when an order's payment fails or
     * expires. Mirrors the decrement performed at order creation. Callers are
     * responsible for guarding against double-restoration (see Order
     * stock_restored flag / PaymentService).
     */
    public function restoreStock(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            if (! $item->product_id) {
                continue;
            }

            $product = \App\Models\Product::find($item->product_id);
            if (! $product) {
                continue;
            }

            $product->increment('stock', $item->quantity);
            if ($product->times_purchased >= $item->quantity) {
                $product->decrement('times_purchased', $item->quantity);
            }
        }
    }

    /**
     * Process WhatsApp checkout - simplified version with only name, phone, area
     */
    public function processWhatsAppCheckout(Cart $cart, array $data, ?User $user = null): Order
    {
        return DB::transaction(function () use ($cart, $data, $user) {
            $cart->load('items.product');

            if ($cart->isEmpty()) {
                throw new \Exception('Cart is empty');
            }

            // Calculate totals
            $subtotal = $cart->subtotal;
            $discount = 0;
            $couponId = null;
            $couponCode = null;

            // Apply coupon if present in session
            $appliedCoupon = session('applied_coupon');
            if ($appliedCoupon) {
                $coupon = Coupon::find($appliedCoupon['id']);
                if ($coupon && !$coupon->getValidationError($user, $subtotal)) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $couponId = $coupon->id;
                    $couponCode = $coupon->code;

                    // Increment coupon usage
                    $coupon->incrementUsage($user);

                    // Clear coupon from session
                    session()->forget('applied_coupon');
                }
            }

            // Calculate delivery fee
            $deliveryFee = $subtotal >= 100 ? 0 : 5;
            $total = $subtotal + $deliveryFee - $discount;

            // Create order
            $order = Order::create([
                'user_id' => $user?->id,
                'coupon_id' => $couponId,
                'coupon_code' => $couponCode,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => 0,
                'shipping_fee' => $deliveryFee,
                'discount' => $discount,
                'total' => $total,
                'customer_name' => $data['customer_name'],
                'customer_email' => $user?->email,
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => [
                    'area' => $data['delivery_area'],
                ],
                'billing_address' => null,
                'notes' => 'WhatsApp Order',
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
                $previousStock = $item->product->stock;
                $item->product->decrement('stock', $item->quantity);
                $item->product->increment('times_purchased', $item->quantity);
                $item->product->refresh();
                $this->notificationService->checkAndNotifyLowStock($item->product, $previousStock);
            }

            // Clear cart
            $this->cartService->clear($cart);

            $loaded = $order->load('items');
            $this->notificationService->notifyNewOrder($loaded);

            return $loaded;
        });
    }
}
