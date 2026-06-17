<?php

namespace Tests\Support;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;

/**
 * Helper for building an order with real products + items so stock-restoration
 * paths have something to act on. Mirrors how CheckoutService creates orders:
 * stock is already reserved (decremented) at creation time.
 */
trait CreatesOrders
{
    /**
     * @param  array<int, array{price?: float, quantity?: int, stock_after?: int}>  $items
     */
    protected function makeOrder(array $attributes = [], array $items = [], ?User $user = null): Order
    {
        $user ??= User::factory()->create();
        $category = Category::factory()->create();

        if ($items === []) {
            $items = [['price' => 50, 'quantity' => 2, 'stock_after' => 8]];
        }

        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += ($item['price'] ?? 50) * ($item['quantity'] ?? 1);
        }

        $order = Order::factory()->forUser($user)->create(array_merge([
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'moyasar',
            'payment_provider' => 'moyasar',
            'subtotal' => $subtotal,
            'tax' => 0,
            'shipping_fee' => 0,
            'discount' => 0,
            'total' => $subtotal,
            'stock_restored' => false,
        ], $attributes));

        foreach ($items as $item) {
            // stock_after = inventory remaining AFTER the reservation, so a
            // successful restock should bring it back up by `quantity`.
            $product = Product::factory()->create([
                'category_id' => $category->id,
                'price' => $item['price'] ?? 50,
                'stock' => $item['stock_after'] ?? 8,
                'times_purchased' => $item['quantity'] ?? 1,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'price' => $product->price,
                'quantity' => $item['quantity'] ?? 1,
                'subtotal' => ($item['price'] ?? 50) * ($item['quantity'] ?? 1),
            ]);
        }

        return $order->load('items');
    }
}
