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
            'email' => 'admin@hardrock-demo.com',
            'role' => 'admin',
            'password' => Hash::make('demo1234'),
            'email_verified_at' => now(),
        ]);

        // Demo customer accounts (for variety in reviews)
        $customers = [
            ['name' => 'Sara Ahmed', 'email' => 'sara@demo.com'],
            ['name' => 'John Smith', 'email' => 'john@demo.com'],
            ['name' => 'Layla Hassan', 'email' => 'layla@demo.com'],
            ['name' => 'Michael Chen', 'email' => 'michael@demo.com'],
            ['name' => 'Fatima Noor', 'email' => 'fatima@demo.com'],
            ['name' => 'Omar Khalid', 'email' => 'omar@demo.com'],
            ['name' => 'Elena Rodriguez', 'email' => 'elena@demo.com'],
        ];

        foreach ($customers as $customer) {
            User::create([
                'name' => $customer['name'],
                'email' => $customer['email'],
                'role' => 'customer',
                'password' => Hash::make('demo1234'),
                'email_verified_at' => now(),
            ]);
        }

        User::create([
            'name' => 'Demo Customer',
            'email' => 'customer@hardrock-demo.com',
            'role' => 'customer',
            'password' => Hash::make('demo1234'),
            'email_verified_at' => now(),
        ]);
    }
}
