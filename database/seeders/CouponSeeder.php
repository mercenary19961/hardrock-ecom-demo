<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'WELCOME10',
                'name' => '10% Welcome Discount',
                'name_ar' => 'خصم ترحيبي 10%',
                'description' => 'Get 10% off on your first order! Valid for all products.',
                'description_ar' => 'احصل على خصم 10% على طلبك الأول! صالح لجميع المنتجات.',
                'type' => 'percentage',
                'value' => 10.00,
                'min_order_amount' => null,
                'max_discount' => 50.00, // Max 50 JOD discount
                'usage_limit' => null, // Unlimited total uses
                'per_user_limit' => 1, // One time per user
                'starts_at' => null,
                'expires_at' => now()->addYear(), // Valid for 1 year
                'is_active' => true,
            ],
            [
                'code' => 'SAVE20',
                'name' => '20% Off Orders Over 50 JOD',
                'name_ar' => 'خصم 20% للطلبات فوق 50 دينار',
                'description' => 'Save 20% when you spend 50 JOD or more. Maximum discount 30 JOD.',
                'description_ar' => 'وفر 20% عند الشراء بقيمة 50 دينار أو أكثر. الحد الأقصى للخصم 30 دينار.',
                'type' => 'percentage',
                'value' => 20.00,
                'min_order_amount' => 50.00,
                'max_discount' => 30.00, // Max 30 JOD discount
                'usage_limit' => 100, // Total 100 uses
                'per_user_limit' => 3, // 3 times per user
                'starts_at' => null,
                'expires_at' => now()->addMonths(6), // Valid for 6 months
                'is_active' => true,
            ],
            [
                'code' => 'FLAT5',
                'name' => '5 JOD Off',
                'name_ar' => 'خصم 5 دينار',
                'description' => 'Get 5 JOD off on any order of 25 JOD or more.',
                'description_ar' => 'احصل على خصم 5 دينار على أي طلب بقيمة 25 دينار أو أكثر.',
                'type' => 'fixed',
                'value' => 5.00,
                'min_order_amount' => 25.00,
                'max_discount' => null, // Not applicable for fixed
                'usage_limit' => 500, // Total 500 uses
                'per_user_limit' => null, // Unlimited per user
                'starts_at' => null,
                'expires_at' => now()->addMonths(3), // Valid for 3 months
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $couponData) {
            Coupon::updateOrCreate(
                ['code' => $couponData['code']],
                $couponData
            );
        }

        $this->command->info('Created/Updated 3 coupons: WELCOME10, SAVE20, FLAT5');
    }
}
