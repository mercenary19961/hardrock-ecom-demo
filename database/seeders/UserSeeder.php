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
        // Some customers have recent dates (Feb 1-2) for dashboard demo
        $customers = [
            ['name' => 'Sara Ahmed', 'email' => 'sara@demo.com', 'created_at' => now()->subDays(1)], // Feb 2
            ['name' => 'John Smith', 'email' => 'john@demo.com', 'created_at' => now()->subDays(2)], // Feb 1
            ['name' => 'Layla Hassan', 'email' => 'layla@demo.com', 'created_at' => now()->subDays(1)], // Feb 2
            ['name' => 'Michael Chen', 'email' => 'michael@demo.com', 'created_at' => now()->subDays(10)],
            ['name' => 'Fatima Noor', 'email' => 'fatima@demo.com', 'created_at' => now()->subDays(15)],
            ['name' => 'Omar Khalid', 'email' => 'omar@demo.com', 'created_at' => now()->subDays(20)],
            ['name' => 'Elena Rodriguez', 'email' => 'elena@demo.com', 'created_at' => now()->subDays(25)],
        ];

        foreach ($customers as $customer) {
            User::create([
                'name' => $customer['name'],
                'email' => $customer['email'],
                'role' => 'customer',
                'password' => Hash::make('demo1234'),
                'email_verified_at' => $customer['created_at'],
                'created_at' => $customer['created_at'],
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
