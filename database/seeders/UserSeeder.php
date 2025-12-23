<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@hardrock-co.com',
            'role' => 'admin',
            'password' => Hash::make('demo1234'),
            'email_verified_at' => now(),
        ]);

        // Demo customer
        User::create([
            'name' => 'Demo Customer',
            'email' => 'customer@hardrock-co.com',
            'role' => 'customer',
            'password' => Hash::make('demo1234'),
            'email_verified_at' => now(),
        ]);
    }
}
