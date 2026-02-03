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

        // Get a diverse set of products including specific ones like the hoodie
        $hoodie = Product::where('slug', 'zip-hoodie-men-fleece-lined')->first();
        $randomProducts = Product::where('is_active', true)
            ->inRandomOrder()
            ->take(15)
            ->get();

        // Merge hoodie with random products (if it exists)
        $products = $hoodie
            ? $randomProducts->push($hoodie)->unique('id')
            : $randomProducts;

        if (!$customer || $products->isEmpty()) {
            return;
        }

        $statuses = ['pending', 'processing', 'delivered', 'cancelled'];
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

        // Create sample orders with specific dates for dashboard demo
        // First few orders are recent (Feb 1-2), rest are older
        $orderDates = [
            now()->subDays(1)->setHour(10)->setMinute(30), // Feb 2, 10:30 AM
            now()->subDays(1)->setHour(14)->setMinute(15), // Feb 2, 2:15 PM
            now()->subDays(1)->setHour(18)->setMinute(45), // Feb 2, 6:45 PM
            now()->subDays(2)->setHour(9)->setMinute(0),   // Feb 1, 9:00 AM
            now()->subDays(2)->setHour(16)->setMinute(20), // Feb 1, 4:20 PM
            now()->subDays(5),
            now()->subDays(8),
            now()->subDays(12),
            now()->subDays(20),
            now()->subDays(28),
        ];

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

            // Recent orders (first 5) are mostly delivered/processing with paid status
            if ($i < 5) {
                $orderStatus = ['delivered', 'processing', 'delivered', 'pending', 'delivered'][$i];
                $paymentStatus = $orderStatus === 'pending' ? 'pending' : 'paid';
            } else {
                $orderStatus = $statuses[array_rand($statuses)];
                // Determine payment status based on order status
                if ($orderStatus === 'delivered') {
                    $paymentStatus = 'paid';
                } elseif ($orderStatus === 'cancelled') {
                    $paymentStatus = ['failed', 'refunded'][array_rand(['failed', 'refunded'])];
                } else {
                    $paymentStatus = $paymentStatuses[array_rand($paymentStatuses)];
                }
            }

            $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
            $createdAt = $orderDates[$i];

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

                // Update times_purchased on the product (only for completed/delivered orders)
                if (in_array($orderStatus, ['delivered', 'processing'])) {
                    Product::where('id', $item['product_id'])
                        ->increment('times_purchased', $item['quantity']);
                }
            }
        }
    }
}
