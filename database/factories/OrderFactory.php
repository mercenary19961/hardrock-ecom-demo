<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 20, 500);
        $tax = round($subtotal * 0.16, 2);
        $discount = 0;
        $total = $subtotal + $tax - $discount;

        return [
            'user_id' => User::factory(),
            'order_number' => Order::generateOrderNumber(),
            'status' => 'pending',
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping_fee' => 0,
            'discount' => $discount,
            'total' => $total,
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => fake()->phoneNumber(),
            'shipping_address' => [
                'area' => fake()->city(),
                'street' => fake()->streetAddress(),
                'building' => fake()->buildingNumber(),
            ],
            'billing_address' => null,
            'notes' => null,
            'admin_notes' => null,
            'tracking_number' => null,
            'carrier' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'shipped',
            'tracking_number' => fake()->bothify('????########'),
            'carrier' => fake()->randomElement(['DHL', 'FedEx', 'Aramex']),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'delivered',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => 'paid',
            'paid_at' => now(),
            'transaction_id' => fake()->uuid(),
        ]);
    }

    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
        ]);
    }
}
