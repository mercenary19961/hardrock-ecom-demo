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
        Review::query()->delete();
        $customers = User::where('role', 'customer')->get();

        if ($customers->isEmpty()) {
            return;
        }

        // Sample reviews data - bilingual with regional accents
        $reviewTemplates = [
            [
                'rating' => 5,
                'title' => 'Excellent product!',
                'title_ar' => 'منتج بجنن والله!', // Jordanian accent
                'comment' => 'This exceeded my expectations. The quality is outstanding and it arrived quickly. Highly recommend!',
                'comment_ar' => 'صراحة الجودة بتجنن والتوصيل كان سريع كتير. بنصح فيه وبقوة!', // Jordanian/Levantine
            ],
            [
                'rating' => 5,
                'title' => 'Perfect quality',
                'title_ar' => 'مررره بطل!', // Saudi accent
                'comment' => 'Absolutely love it! Great value for money and exactly as described.',
                'comment_ar' => 'يجنن صراحة! يستاهل كل ريال ونفس الوصف بالضبط.', // Saudi
            ],
            [
                'rating' => 4,
                'title' => 'Very good',
                'title_ar' => 'كويس كتير', // Jordanian
                'comment' => 'Good product overall. Minor issues but nothing major. Would buy again.',
                'comment_ar' => 'المنتج منيح بشكل عام، في ملاحظات بسيطة بس مو مشكلة. برجع بشتري منه.', // Levantine
            ],
            [
                'rating' => 4,
                'title' => 'Great purchase',
                'title_ar' => 'خوش طلبية', // Gulf/Saudi influence
                'comment' => 'Really happy with this purchase. Fast shipping and good packaging.',
                'comment_ar' => 'مرة مبسوط بالطلبية. الشحن سريع والتغليف ممتاز.', // Saudi
            ],
            [
                'rating' => 5,
                'title' => 'Amazing!',
                'title_ar' => 'اشي فاخر من الآخر!', // Jordanian slang
                'comment' => 'This is exactly what I was looking for. Premium quality at a reasonable price.',
                'comment_ar' => 'هاد بالزبط اللي كنت بدور عليه. جودة عالية وسعر مناسب جداً.', // Jordanian
            ],
            [
                'rating' => 3,
                'title' => 'Decent product',
                'title_ar' => 'ماشي حاله', // Common dialect
                'comment' => 'It works fine for the price. Could be better but not bad either.',
                'comment_ar' => 'على قد سعره منيح، يعني بمشي الحال بس ممكن يكون أحسن.', // Jordanian
            ],
            [
                'rating' => 5,
                'title' => 'Best in class',
                'title_ar' => 'فوق الخيال!', // Saudi
                'comment' => 'Outstanding quality and design. This is my third purchase from this store.',
                'comment_ar' => 'جودة وتصميم فوق الخيال. هذي ثالث مرة أطلب من المتجر وما خيبوا ظني.', // Saudi
            ],
            [
                'rating' => 4,
                'title' => 'Good value',
                'title_ar' => 'سعر لقطة', // Jordanian
                'comment' => 'Solid product. Meets expectations and delivered on time.',
                'comment_ar' => 'المنتج متين ووصل على الموعد. سعره لقطة بالنسبة لجودته.', // Jordanian
            ],
        ];

        // 1. Specifically seed 5 reviews for the Zip Up Hoodie
        $hoodie = Product::where('slug', 'zip-hoodie-men-fleece-lined')->first();
        if ($hoodie) {
            $hoodieReviews = [
                [
                    'rating' => 5,
                    'title' => 'Best hoodie I own',
                    'title_ar' => 'أحلى هودي اشتريته!', // Jordanian
                    'comment' => 'The fleece lining is so soft and it fits perfectly. Worth every penny.',
                    'comment_ar' => 'البطانة الصوفية بتجنن وكتير ناعمة، والمقاس طالع علي رهيب. بيستاهل كل قرش.', // Jordanian
                ],
                [
                    'rating' => 5,
                    'title' => 'Great for winter',
                    'title_ar' => 'مررره يدفي!', // Saudi
                    'comment' => 'Very warm and comfortable. The colors are exactly as shown in the pictures.',
                    'comment_ar' => 'الخامة ثقيلة ومرة تدفي ومريحة. والألوان بالمانشيت نفس الحقيقة بالضبط.', // Saudi
                ],
                [
                    'rating' => 4,
                    'title' => 'Quality material',
                    'title_ar' => 'قماشه فخم', // Common
                    'comment' => 'Good fabric, doesn\'t shrink after washing. A bit thicker than expected but that\'s a plus.',
                    'comment_ar' => 'القماش ممتاز وما بيخرب بالغسيل. أثقل شوي مما توقعت بس طلع أحسن للدفا.', // Jordanian
                ],
                [
                    'rating' => 5,
                    'title' => 'Highly recommended',
                    'title_ar' => 'يا جماعة خذوه وانتم مغمضين', // Saudi slang
                    'comment' => 'Bought the grey one, now I want all the other colors! Perfect for the gym.',
                    'comment_ar' => 'أقسم بالله الهودي يجنن! أخذت الرمادي وراح أطلب كل الألوان الباقية. بطل للنادي.', // Saudi
                ],
                [
                    'rating' => 5,
                    'title' => 'Excellent value',
                    'title_ar' => 'لقطة لا تفوتوها', // Jordanian
                    'comment' => 'You won\'t find this quality at this price elsewhere. The zipper is very smooth.',
                    'comment_ar' => 'ما رح تلاقوا هيك جودة بهاد السعر بمكان تاني. السحاب كتير سلس ونوعيته فخمة.', // Jordanian
                ],
            ];

            foreach ($hoodieReviews as $index => $reviewData) {
                // Last one is English, others are Arabic
                $isLast = $index === count($hoodieReviews) - 1;
                Review::create([
                    'product_id' => $hoodie->id,
                    'user_id' => $customers[$index % $customers->count()]->id,
                    'rating' => $reviewData['rating'],
                    'title' => $reviewData['title'],
                    'title_ar' => $reviewData['title_ar'],
                    'comment' => $reviewData['comment'],
                    'comment_ar' => $reviewData['comment_ar'],
                    'is_verified_purchase' => true,
                    'helpful_count' => rand(5, 50),
                    'language' => $isLast ? 'en' : 'ar',
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);
            }
            $hoodie->updateRatingStats();
        }

        // 2. Randomly seed reviews for other products
        $products = Product::where('is_active', true)
            ->where('id', '!=', $hoodie?->id)
            ->inRandomOrder()
            ->take(30)
            ->get();

        foreach ($products as $product) {
            $numReviews = rand(1, 4);
            $usedUsers = [];
            
            for ($i = 0; $i < $numReviews; $i++) {
                $user = $customers->random();
                if (in_array($user->id, $usedUsers)) continue;
                $usedUsers[] = $user->id;

                $template = $reviewTemplates[array_rand($reviewTemplates)];

                Review::create([
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'rating' => $template['rating'],
                    'title' => $template['title'],
                    'title_ar' => $template['title_ar'],
                    'comment' => $template['comment'],
                    'comment_ar' => $template['comment_ar'],
                    'is_verified_purchase' => rand(0, 1) === 1,
                    'helpful_count' => rand(0, 25),
                    'language' => 'ar',
                    'created_at' => now()->subDays(rand(1, 90)),
                ]);
            }

            $product->updateRatingStats();
        }
    }
}
