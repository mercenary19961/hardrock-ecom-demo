<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        $price = fake()->randomFloat(2, 9.99, 999.99);
        $hasDiscount = fake()->boolean(30);

        return [
            'category_id' => Category::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraphs(3, true),
            'short_description' => fake()->sentence(15),
            'price' => $price,
            'compare_price' => $hasDiscount ? $price * fake()->randomFloat(2, 1.1, 1.5) : null,
            'sku' => strtoupper(fake()->unique()->bothify('??-####')),
            'stock' => fake()->numberBetween(0, 100),
            'is_active' => true,
            'is_featured' => fake()->boolean(20),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }

    public function withDiscount(float $percentage = 20): static
    {
        return $this->state(function (array $attributes) use ($percentage) {
            $comparePrice = $attributes['price'] * (1 + $percentage / 100);
            return [
                'compare_price' => round($comparePrice, 2),
            ];
        });
    }
}
