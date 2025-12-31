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
                'name_ar' => 'إلكترونيات',
                'description' => 'Latest gadgets, devices, and electronic accessories for the modern lifestyle.',
                'description_ar' => 'أحدث الأجهزة والإكسسوارات الإلكترونية لأسلوب الحياة العصري.',
                'children' => [
                    [
                        'name' => 'Smartphones',
                        'name_ar' => 'الهواتف الذكية',
                        'description' => 'Latest smartphones from top brands',
                        'description_ar' => 'أحدث الهواتف الذكية من أفضل العلامات التجارية',
                    ],
                    [
                        'name' => 'Laptops',
                        'name_ar' => 'أجهزة اللابتوب',
                        'description' => 'Powerful laptops for work and play',
                        'description_ar' => 'أجهزة لابتوب قوية للعمل والترفيه',
                    ],
                    [
                        'name' => 'Accessories',
                        'name_ar' => 'الإكسسوارات',
                        'description' => 'Cables, chargers, cases, and more',
                        'description_ar' => 'كابلات وشواحن وحافظات والمزيد',
                    ],
                ],
            ],
            [
                'name' => 'Skincare',
                'name_ar' => 'العناية بالبشرة',
                'description' => 'Premium skincare products for healthy, glowing skin.',
                'description_ar' => 'منتجات عناية بالبشرة فاخرة لبشرة صحية ومشرقة.',
                'children' => [],
            ],
        ];

        foreach ($categories as $index => $categoryData) {
            $parent = Category::create([
                'name' => $categoryData['name'],
                'name_ar' => $categoryData['name_ar'],
                'slug' => Str::slug($categoryData['name']),
                'description' => $categoryData['description'],
                'description_ar' => $categoryData['description_ar'],
                'sort_order' => $index,
                'is_active' => true,
            ]);

            if (!empty($categoryData['children'])) {
                foreach ($categoryData['children'] as $childIndex => $childData) {
                    Category::create([
                        'name' => $childData['name'],
                        'name_ar' => $childData['name_ar'],
                        'slug' => Str::slug($childData['name']),
                        'description' => $childData['description'],
                        'description_ar' => $childData['description_ar'],
                        'parent_id' => $parent->id,
                        'sort_order' => $childIndex,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
