<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
            'verified_via' => null,
        ]);
    }

    /**
     * Create an admin user.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }

    /**
     * Create a customer user.
     */
    public function customer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'customer',
        ]);
    }

    /**
     * Indicate that the user was verified via email.
     */
    public function verifiedViaEmail(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => now(),
            'verified_via' => 'email',
        ]);
    }

    /**
     * Indicate that the user was verified via Google OAuth.
     */
    public function verifiedViaGoogle(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => now(),
            'verified_via' => 'google',
            'avatar' => 'https://lh3.googleusercontent.com/a/default-user',
        ]);
    }
}
