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
            [
                'name' => 'Building Blocks',
                'name_ar' => 'مكعبات البناء',
                'slug' => 'building-blocks',
                'description' => 'Creative building sets for all ages.',
                'description_ar' => 'مجموعات بناء إبداعية لجميع الأعمار.',
                'children' => [],
            ],
            [
                'name' => 'Fashion',
                'name_ar' => 'الأزياء',
                'description' => 'Trendy clothing and accessories for every style.',
                'description_ar' => 'ملابس وإكسسوارات عصرية لكل الأذواق.',
                'children' => [
                    [
                        'name' => 'Men\'s Fashion',
                        'name_ar' => 'أزياء رجالية',
                        'description' => 'Stylish clothing for men',
                        'description_ar' => 'ملابس أنيقة للرجال',
                    ],
                    [
                        'name' => 'Women\'s Fashion',
                        'name_ar' => 'أزياء نسائية',
                        'description' => 'Elegant fashion for women',
                        'description_ar' => 'أزياء أنيقة للنساء',
                    ],
                ],
            ],
            [
                'name' => 'Home & Kitchen',
                'name_ar' => 'المنزل والمطبخ',
                'slug' => 'home-kitchen',
                'description' => 'Everything for your home and kitchen needs.',
                'description_ar' => 'كل ما تحتاجه لمنزلك ومطبخك.',
                'children' => [
                    [
                        'name' => 'Kitchen Appliances',
                        'name_ar' => 'أجهزة المطبخ',
                        'description' => 'Modern kitchen appliances',
                        'description_ar' => 'أجهزة مطبخ حديثة',
                    ],
                    [
                        'name' => 'Home Decor',
                        'name_ar' => 'ديكور المنزل',
                        'description' => 'Beautiful home decorations',
                        'description_ar' => 'ديكورات منزلية جميلة',
                    ],
                ],
            ],
            [
                'name' => 'Sports',
                'name_ar' => 'الرياضة',
                'description' => 'Sports equipment and fitness gear.',
                'description_ar' => 'معدات رياضية وأدوات اللياقة البدنية.',
                'children' => [
                    [
                        'name' => 'Fitness Equipment',
                        'name_ar' => 'معدات اللياقة',
                        'description' => 'Home and gym fitness equipment',
                        'description_ar' => 'معدات لياقة للمنزل والنادي',
                    ],
                    [
                        'name' => 'Sports Gear',
                        'name_ar' => 'أدوات رياضية',
                        'description' => 'Equipment for various sports',
                        'description_ar' => 'معدات لمختلف الرياضات',
                    ],
                ],
            ],
            [
                'name' => 'Stationery',
                'name_ar' => 'القرطاسية',
                'description' => 'Office and school supplies.',
                'description_ar' => 'مستلزمات المكتب والمدرسة.',
                'children' => [
                    [
                        'name' => 'Office Supplies',
                        'name_ar' => 'مستلزمات المكتب',
                        'description' => 'Essential office supplies',
                        'description_ar' => 'مستلزمات مكتبية أساسية',
                    ],
                    [
                        'name' => 'School Supplies',
                        'name_ar' => 'مستلزمات مدرسية',
                        'description' => 'Everything for school',
                        'description_ar' => 'كل ما يلزم للمدرسة',
                    ],
                ],
            ],
            [
                'name' => 'Kids',
                'name_ar' => 'الأطفال',
                'description' => 'Products for children of all ages.',
                'description_ar' => 'منتجات للأطفال من جميع الأعمار.',
                'children' => [
                    [
                        'name' => 'Toys',
                        'name_ar' => 'ألعاب',
                        'description' => 'Fun toys for kids',
                        'description_ar' => 'ألعاب ممتعة للأطفال',
                    ],
                    [
                        'name' => 'Kids\' Clothing',
                        'name_ar' => 'ملابس أطفال',
                        'description' => 'Comfortable clothes for children',
                        'description_ar' => 'ملابس مريحة للأطفال',
                    ],
                ],
            ],
        ];

        foreach ($categories as $index => $categoryData) {
            $parent = Category::create([
                'name' => $categoryData['name'],
                'name_ar' => $categoryData['name_ar'],
                'slug' => $categoryData['slug'] ?? Str::slug($categoryData['name']),
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
                        'slug' => $childData['slug'] ?? Str::slug($childData['name']),
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
