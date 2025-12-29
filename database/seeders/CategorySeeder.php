<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Electronics',
                'description' => 'Latest gadgets, devices, and electronic accessories for the modern lifestyle.',
                'children' => [
                    ['name' => 'Smartphones', 'description' => 'Latest smartphones from top brands'],
                    ['name' => 'Laptops', 'description' => 'Powerful laptops for work and play'],
                    ['name' => 'Accessories', 'description' => 'Cables, chargers, cases, and more'],
                ],
            ],
            [
                'name' => 'Skincare',
                'description' => 'Premium skincare products for healthy, glowing skin.',
                'children' => [],
            ],
        ];

        foreach ($categories as $index => $categoryData) {
            $parent = Category::create([
                'name' => $categoryData['name'],
                'slug' => Str::slug($categoryData['name']),
                'description' => $categoryData['description'],
                'sort_order' => $index,
                'is_active' => true,
            ]);

            if (!empty($categoryData['children'])) {
                foreach ($categoryData['children'] as $childIndex => $childData) {
                    Category::create([
                        'name' => $childData['name'],
                        'slug' => Str::slug($childData['name']),
                        'description' => $childData['description'],
                        'parent_id' => $parent->id,
                        'sort_order' => $childIndex,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
