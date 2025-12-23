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
                'name' => 'Clothing',
                'description' => 'Stylish apparel for men, women, and children.',
                'children' => [
                    ['name' => 'Men\'s Wear', 'description' => 'Trendy clothing for men'],
                    ['name' => 'Women\'s Wear', 'description' => 'Fashion-forward women\'s clothing'],
                    ['name' => 'Kids', 'description' => 'Comfortable and fun clothes for children'],
                ],
            ],
            [
                'name' => 'Home & Garden',
                'description' => 'Everything you need to make your house a home.',
                'children' => [
                    ['name' => 'Furniture', 'description' => 'Quality furniture for every room'],
                    ['name' => 'Decor', 'description' => 'Beautiful decorative items'],
                    ['name' => 'Kitchen', 'description' => 'Kitchen essentials and appliances'],
                ],
            ],
            [
                'name' => 'Sports & Outdoors',
                'description' => 'Gear up for your active lifestyle.',
                'children' => [
                    ['name' => 'Fitness', 'description' => 'Exercise equipment and gear'],
                    ['name' => 'Outdoor Recreation', 'description' => 'Camping, hiking, and outdoor gear'],
                ],
            ],
            [
                'name' => 'Books & Media',
                'description' => 'Books, music, movies, and more for entertainment.',
                'children' => [
                    ['name' => 'Fiction', 'description' => 'Novels and fictional works'],
                    ['name' => 'Non-Fiction', 'description' => 'Educational and informative books'],
                ],
            ],
            [
                'name' => 'Health & Beauty',
                'description' => 'Personal care, wellness, and beauty products.',
                'children' => [
                    ['name' => 'Skincare', 'description' => 'Products for healthy, glowing skin'],
                    ['name' => 'Wellness', 'description' => 'Supplements and wellness products'],
                ],
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

            if (isset($categoryData['children'])) {
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
