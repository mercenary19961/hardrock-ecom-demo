<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        // Use customer account for demo orders
        $customer = User::where('email', 'customer@hardrock-demo.com')->first();
        $products = Product::take(10)->get();

        if (!$customer || $products->isEmpty()) {
            return;
        }

        $statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        $paymentStatuses = ['pending', 'paid', 'paid', 'paid', 'failed', 'refunded'];
        $paymentMethods = ['card', 'paypal', 'cod'];
        $addresses = [
            [
                'street' => '123 Main Street',
                'city' => 'Amman',
                'state' => 'Amman Governorate',
                'postal_code' => '11118',
                'country' => 'Jordan',
            ],
            [
                'street' => '456 Oak Avenue',
                'city' => 'Dubai',
                'state' => 'Dubai',
                'postal_code' => '00000',
                'country' => 'UAE',
            ],
        ];

        // Create sample orders
        for ($i = 0; $i < 10; $i++) {
            $orderProducts = $products->random(rand(1, 3));
            $subtotal = 0;
            $items = [];

            foreach ($orderProducts as $product) {
                $quantity = rand(1, 3);
                $itemSubtotal = $product->price * $quantity;
                $subtotal += $itemSubtotal;

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'price' => $product->price,
                    'quantity' => $quantity,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $tax = round($subtotal * 0.1, 2); // 10% tax
            $total = $subtotal + $tax;

            $orderStatus = $statuses[array_rand($statuses)];
            $paymentMethod = $paymentMethods[array_rand($paymentMethods)];

            // Determine payment status based on order status
            if ($orderStatus === 'delivered') {
                $paymentStatus = 'paid';
            } elseif ($orderStatus === 'cancelled') {
                $paymentStatus = ['failed', 'refunded'][array_rand(['failed', 'refunded'])];
            } else {
                $paymentStatus = $paymentStatuses[array_rand($paymentStatuses)];
            }

            $createdAt = now()->subDays(rand(1, 30));

            $order = Order::create([
                'user_id' => $customer->id,
                'order_number' => Order::generateOrderNumber(),
                'status' => $orderStatus,
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentMethod,
                'paid_at' => $paymentStatus === 'paid' ? $createdAt->copy()->addMinutes(rand(1, 60)) : null,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => '+962 79 123 4567',
                'shipping_address' => $addresses[array_rand($addresses)],
                'billing_address' => $addresses[0],
                'notes' => $i % 3 === 0 ? 'Please leave at the door.' : null,
                'created_at' => $createdAt,
            ]);

            foreach ($items as $item) {
                OrderItem::create(array_merge($item, ['order_id' => $order->id]));
            }
        }
    }
}
