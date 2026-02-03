<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('????##')),
            'name' => fake()->words(2, true),
            'name_ar' => null,
            'description' => fake()->sentence(),
            'description_ar' => null,
            'type' => 'percentage',
            'value' => fake()->randomElement([5, 10, 15, 20, 25]),
            'min_order_amount' => null,
            'max_discount' => null,
            'usage_limit' => null,
            'usage_count' => 0,
            'per_user_limit' => null,
            'starts_at' => null,
            'expires_at' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function notYetStarted(): static
    {
        return $this->state(fn (array $attributes) => [
            'starts_at' => now()->addDay(),
        ]);
    }

    public function exhausted(): static
    {
        return $this->state(fn (array $attributes) => [
            'usage_limit' => 10,
            'usage_count' => 10,
        ]);
    }

    public function fixed(float $amount = 5): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'fixed',
            'value' => $amount,
        ]);
    }

    public function percentage(float $percent = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'percentage',
            'value' => $percent,
        ]);
    }

    public function withMinOrder(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'min_order_amount' => $amount,
        ]);
    }

    public function withMaxDiscount(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'max_discount' => $amount,
        ]);
    }

    public function withUserLimit(int $limit): static
    {
        return $this->state(fn (array $attributes) => [
            'per_user_limit' => $limit,
        ]);
    }

    public function withUsageLimit(int $limit): static
    {
        return $this->state(fn (array $attributes) => [
            'usage_limit' => $limit,
        ]);
    }
}
