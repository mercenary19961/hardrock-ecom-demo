<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@hardrock-demo.com')->first();

        if (!$customer) {
            return;
        }

        // Sample reviews data - bilingual
        $reviewTemplates = [
            [
                'rating' => 5,
                'title' => 'Excellent product!',
                'title_ar' => 'منتج ممتاز!',
                'comment' => 'This exceeded my expectations. The quality is outstanding and it arrived quickly. Highly recommend!',
                'comment_ar' => 'تجاوز هذا توقعاتي. الجودة ممتازة ووصل بسرعة. أنصح به بشدة!',
            ],
            [
                'rating' => 5,
                'title' => 'Perfect quality',
                'title_ar' => 'جودة مثالية',
                'comment' => 'Absolutely love it! Great value for money and exactly as described.',
                'comment_ar' => 'أحببته تماماً! قيمة رائعة مقابل المال ومطابق للوصف.',
            ],
            [
                'rating' => 4,
                'title' => 'Very good',
                'title_ar' => 'جيد جداً',
                'comment' => 'Good product overall. Minor issues but nothing major. Would buy again.',
                'comment_ar' => 'منتج جيد بشكل عام. بعض المشاكل البسيطة لكن لا شيء كبير. سأشتري مرة أخرى.',
            ],
            [
                'rating' => 4,
                'title' => 'Great purchase',
                'title_ar' => 'شراء رائع',
                'comment' => 'Really happy with this purchase. Fast shipping and good packaging.',
                'comment_ar' => 'سعيد جداً بهذا الشراء. شحن سريع وتغليف جيد.',
            ],
            [
                'rating' => 5,
                'title' => 'Amazing!',
                'title_ar' => 'مذهل!',
                'comment' => 'This is exactly what I was looking for. Premium quality at a reasonable price.',
                'comment_ar' => 'هذا بالضبط ما كنت أبحث عنه. جودة ممتازة بسعر معقول.',
            ],
            [
                'rating' => 3,
                'title' => 'Decent product',
                'title_ar' => 'منتج لا بأس به',
                'comment' => 'It works fine for the price. Could be better but not bad either.',
                'comment_ar' => 'يعمل بشكل جيد بالنسبة للسعر. يمكن أن يكون أفضل لكنه ليس سيئاً.',
            ],
            [
                'rating' => 5,
                'title' => 'Best in class',
                'title_ar' => 'الأفضل في فئته',
                'comment' => 'Outstanding quality and design. This is my third purchase from this store.',
                'comment_ar' => 'جودة وتصميم متميز. هذه ثالث عملية شراء لي من هذا المتجر.',
            ],
            [
                'rating' => 4,
                'title' => 'Good value',
                'title_ar' => 'قيمة جيدة',
                'comment' => 'Solid product. Meets expectations and delivered on time.',
                'comment_ar' => 'منتج متين. يلبي التوقعات وتم تسليمه في الوقت المحدد.',
            ],
        ];

        // Get some products to add reviews to (one review per product from customer)
        $products = Product::where('is_active', true)
            ->inRandomOrder()
            ->take(15)
            ->get();

        foreach ($products as $index => $product) {
            // Pick a random template for this product (one review per product)
            $template = $reviewTemplates[$index % count($reviewTemplates)];

            Review::create([
                'product_id' => $product->id,
                'user_id' => $customer->id,
                'rating' => $template['rating'],
                'title' => $template['title'],
                'title_ar' => $template['title_ar'],
                'comment' => $template['comment'],
                'comment_ar' => $template['comment_ar'],
                'is_verified_purchase' => rand(0, 1) === 1,
                'helpful_count' => rand(0, 25),
                'created_at' => now()->subDays(rand(1, 60)),
            ]);

            // Update product rating stats
            $product->updateRatingStats();
        }
    }
}
