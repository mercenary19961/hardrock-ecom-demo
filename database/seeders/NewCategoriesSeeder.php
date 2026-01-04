<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NewCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Fashion & Accessories',
                'name_ar' => 'أزياء وإكسسوارات',
                'slug' => 'fashion',
                'description' => 'Stylish fashion items and accessories for every occasion',
                'description_ar' => 'أزياء وإكسسوارات أنيقة لكل مناسبة',
                'sort_order' => 4,
                'image_folder' => 'fashion',
                'products' => [
                    [
                        'name' => 'Classic Leather Watch',
                        'name_ar' => 'ساعة جلدية كلاسيكية',
                        'description' => 'Elegant unisex watch with genuine leather strap and minimalist dial design. Water-resistant up to 30m, perfect for everyday wear.',
                        'description_ar' => 'ساعة أنيقة للجنسين مع حزام جلد طبيعي وتصميم بسيط للقرص. مقاومة للماء حتى 30 متر، مثالية للاستخدام اليومي.',
                        'price' => 55,
                        'stock' => 30,
                        'image' => 'classic-leather-watch.webp',
                    ],
                    [
                        'name' => 'Polarized Sunglasses',
                        'name_ar' => 'نظارات شمسية مستقطبة',
                        'description' => 'UV400 protection polarized sunglasses with lightweight frame. Reduces glare and protects your eyes in style.',
                        'description_ar' => 'نظارات شمسية مستقطبة بحماية UV400 مع إطار خفيف الوزن. تقلل الوهج وتحمي عينيك بأناقة.',
                        'price' => 30,
                        'stock' => 45,
                        'image' => 'polarized-sunglasses.webp',
                    ],
                    [
                        'name' => 'Leather Crossbody Bag',
                        'name_ar' => 'حقيبة جلدية كروس',
                        'description' => 'Compact genuine leather crossbody bag with adjustable strap. Multiple compartments for organized storage.',
                        'description_ar' => 'حقيبة كروس من الجلد الطبيعي مع حزام قابل للتعديل. جيوب متعددة للتخزين المنظم.',
                        'price' => 42,
                        'stock' => 25,
                        'image' => 'leather-crossbody-bag.webp',
                    ],
                    [
                        'name' => 'Silk Scarf',
                        'name_ar' => 'وشاح حرير',
                        'description' => 'Luxurious 100% silk scarf with elegant pattern. Versatile accessory for any outfit.',
                        'description_ar' => 'وشاح حرير فاخر 100% بنقشة أنيقة. إكسسوار متعدد الاستخدامات لأي إطلالة.',
                        'price' => 25,
                        'stock' => 40,
                        'image' => 'silk-scarf.webp',
                    ],
                ],
            ],
            [
                'name' => 'Home & Kitchen',
                'name_ar' => 'المنزل والمطبخ',
                'slug' => 'home-kitchen',
                'description' => 'Essential items for your home and kitchen',
                'description_ar' => 'مستلزمات أساسية للمنزل والمطبخ',
                'sort_order' => 5,
                'image_folder' => 'home-kitchen',
                'products' => [
                    [
                        'name' => 'French Press Coffee Maker',
                        'name_ar' => 'إبريق قهوة فرنسي',
                        'description' => 'Premium stainless steel French press with 1L capacity. Heat-resistant borosilicate glass for perfect coffee every time.',
                        'description_ar' => 'إبريق قهوة فرنسي من الستانلس ستيل الفاخر بسعة 1 لتر. زجاج بوروسيليكات مقاوم للحرارة لقهوة مثالية في كل مرة.',
                        'price' => 25,
                        'stock' => 35,
                        'image' => 'french-press-coffee-maker.webp',
                    ],
                    [
                        'name' => 'Smart LED Desk Lamp',
                        'name_ar' => 'مصباح مكتب LED ذكي',
                        'description' => 'Touch-controlled LED desk lamp with adjustable brightness and color temperature. USB charging port included.',
                        'description_ar' => 'مصباح مكتب LED بتحكم باللمس مع سطوع ودرجة حرارة لون قابلة للتعديل. يتضمن منفذ شحن USB.',
                        'price' => 32,
                        'stock' => 28,
                        'image' => 'smart-led-desk-lamp.webp',
                    ],
                    [
                        'name' => 'Ceramic Cookware Set 5pc',
                        'name_ar' => 'طقم أواني سيراميك 5 قطع',
                        'description' => 'Non-toxic ceramic coated cookware set. Includes frying pan, saucepan, and stockpot with lids. PFOA-free.',
                        'description_ar' => 'طقم أواني طهي بطلاء سيراميك غير سام. يشمل مقلاة وقدر صلصة وقدر كبير مع أغطية. خالي من PFOA.',
                        'price' => 55,
                        'stock' => 20,
                        'image' => 'ceramic-cookware-set.webp',
                    ],
                    [
                        'name' => 'Aromatherapy Diffuser',
                        'name_ar' => 'موزع عطري للروائح',
                        'description' => 'Ultrasonic essential oil diffuser with LED mood lighting. Quiet operation, auto shut-off, 300ml capacity.',
                        'description_ar' => 'موزع زيوت عطرية بالموجات فوق الصوتية مع إضاءة LED. تشغيل هادئ، إيقاف تلقائي، سعة 300 مل.',
                        'price' => 22,
                        'stock' => 42,
                        'image' => 'aromatherapy-diffuser.webp',
                    ],
                ],
            ],
            [
                'name' => 'Sports & Outdoors',
                'name_ar' => 'رياضة ونشاطات خارجية',
                'slug' => 'sports',
                'description' => 'Gear up for your active lifestyle',
                'description_ar' => 'تجهيزات لنمط حياة نشط',
                'sort_order' => 6,
                'image_folder' => 'sports',
                'products' => [
                    [
                        'name' => 'Premium Yoga Mat 6mm',
                        'name_ar' => 'سجادة يوغا فاخرة 6 ملم',
                        'description' => 'Eco-friendly TPE yoga mat with non-slip surface. 6mm thickness for joint protection. Includes carrying strap.',
                        'description_ar' => 'سجادة يوغا صديقة للبيئة من TPE بسطح مانع للانزلاق. سمك 6 ملم لحماية المفاصل. تتضمن حزام حمل.',
                        'price' => 18,
                        'stock' => 50,
                        'image' => 'premium-yoga-mat.webp',
                    ],
                    [
                        'name' => 'Resistance Bands Set',
                        'name_ar' => 'طقم أحزمة مقاومة',
                        'description' => 'Set of 5 resistance bands with different strength levels. Includes door anchor, handles, and carrying bag.',
                        'description_ar' => 'طقم من 5 أحزمة مقاومة بمستويات قوة مختلفة. يشمل مثبت باب ومقابض وحقيبة حمل.',
                        'price' => 15,
                        'stock' => 60,
                        'image' => 'resistance-bands-set.webp',
                    ],
                    [
                        'name' => 'Insulated Water Bottle 750ml',
                        'name_ar' => 'زجاجة مياه معزولة 750 مل',
                        'description' => 'Double-wall vacuum insulated stainless steel bottle. Keeps drinks cold 24hrs or hot 12hrs. BPA-free.',
                        'description_ar' => 'زجاجة ستانلس ستيل معزولة بجدار مزدوج. تحافظ على المشروبات باردة 24 ساعة أو ساخنة 12 ساعة. خالية من BPA.',
                        'price' => 16,
                        'stock' => 55,
                        'image' => 'insulated-water-bottle.webp',
                    ],
                    [
                        'name' => 'Foldable Camping Chair',
                        'name_ar' => 'كرسي تخييم قابل للطي',
                        'description' => 'Lightweight aluminum frame camping chair with cup holder. Supports up to 120kg. Includes carry bag.',
                        'description_ar' => 'كرسي تخييم بإطار ألمنيوم خفيف الوزن مع حامل أكواب. يتحمل حتى 120 كجم. يتضمن حقيبة حمل.',
                        'price' => 28,
                        'stock' => 30,
                        'image' => 'foldable-camping-chair.webp',
                    ],
                ],
            ],
            [
                'name' => 'Books & Stationery',
                'name_ar' => 'كتب وقرطاسية',
                'slug' => 'stationery',
                'description' => 'Quality stationery and writing supplies',
                'description_ar' => 'قرطاسية ومستلزمات كتابة عالية الجودة',
                'sort_order' => 7,
                'image_folder' => 'stationery',
                'products' => [
                    [
                        'name' => 'Leather Journal Notebook',
                        'name_ar' => 'دفتر جلدي فاخر',
                        'description' => 'Handcrafted genuine leather journal with 200 lined pages. A5 size with ribbon bookmark and elastic closure.',
                        'description_ar' => 'دفتر جلدي مصنوع يدوياً مع 200 صفحة مسطرة. مقاس A5 مع شريط علامة وإغلاق مطاطي.',
                        'price' => 15,
                        'stock' => 45,
                        'image' => 'leather-journal-notebook.webp',
                    ],
                    [
                        'name' => 'Premium Metal Pen Set',
                        'name_ar' => 'طقم أقلام معدنية فاخرة',
                        'description' => 'Elegant metal ballpoint pen set in gift box. Smooth writing experience with replaceable refills.',
                        'description_ar' => 'طقم أقلام حبر جاف معدنية أنيقة في علبة هدايا. كتابة سلسة مع عبوات قابلة للاستبدال.',
                        'price' => 20,
                        'stock' => 40,
                        'image' => 'premium-metal-pen-set.webp',
                    ],
                    [
                        'name' => 'Bamboo Desk Organizer',
                        'name_ar' => 'منظم مكتب خشبي',
                        'description' => 'Eco-friendly bamboo desk organizer with multiple compartments. Perfect for pens, phone, and office supplies.',
                        'description_ar' => 'منظم مكتب من الخيزران الصديق للبيئة مع جيوب متعددة. مثالي للأقلام والهاتف ومستلزمات المكتب.',
                        'price' => 24,
                        'stock' => 35,
                        'image' => 'bamboo-desk-organizer.webp',
                    ],
                    [
                        'name' => 'Arabic Calligraphy Set',
                        'name_ar' => 'طقم خط عربي',
                        'description' => 'Complete Arabic calligraphy starter kit with bamboo pens, ink, and practice sheets. Includes instruction booklet.',
                        'description_ar' => 'طقم خط عربي متكامل للمبتدئين مع أقلام خيزران وحبر وأوراق تدريب. يتضمن كتيب تعليمات.',
                        'price' => 28,
                        'stock' => 25,
                        'image' => 'arabic-calligraphy-set.webp',
                    ],
                ],
            ],
            [
                'name' => 'Baby & Kids',
                'name_ar' => 'الأطفال والرضع',
                'slug' => 'kids',
                'description' => 'Safe and fun products for children',
                'description_ar' => 'منتجات آمنة وممتعة للأطفال',
                'sort_order' => 8,
                'image_folder' => 'kids',
                'products' => [
                    [
                        'name' => 'Wooden Stacking Toys',
                        'name_ar' => 'ألعاب تكديس خشبية',
                        'description' => 'Educational wooden stacking rings in vibrant colors. Non-toxic paint, smooth edges. Ages 1+.',
                        'description_ar' => 'حلقات تكديس خشبية تعليمية بألوان زاهية. طلاء غير سام، حواف ناعمة. للأعمار 1+.',
                        'price' => 14,
                        'stock' => 40,
                        'image' => 'wooden-stacking-toys.webp',
                    ],
                    [
                        'name' => 'Organic Cotton Baby Blanket',
                        'name_ar' => 'بطانية أطفال قطن عضوي',
                        'description' => '100% GOTS certified organic cotton blanket. Hypoallergenic, soft, and breathable. Machine washable.',
                        'description_ar' => 'بطانية قطن عضوي 100% معتمدة من GOTS. مضادة للحساسية، ناعمة وقابلة للتنفس. قابلة للغسيل في الغسالة.',
                        'price' => 22,
                        'stock' => 35,
                        'image' => 'organic-cotton-baby-blanket.webp',
                    ],
                    [
                        'name' => 'Kids Adventure Backpack',
                        'name_ar' => 'حقيبة ظهر أطفال',
                        'description' => 'Durable kids backpack with fun design. Padded straps, multiple pockets, water-resistant material.',
                        'description_ar' => 'حقيبة ظهر متينة للأطفال بتصميم ممتع. أحزمة مبطنة، جيوب متعددة، مادة مقاومة للماء.',
                        'price' => 18,
                        'stock' => 45,
                        'image' => 'kids-adventure-backpack.webp',
                    ],
                    [
                        'name' => 'Kids Learning Tablet',
                        'name_ar' => 'تابلت تعليمي للأطفال',
                        'description' => 'Interactive learning tablet with Arabic and English content. Educational games, songs, and activities. Ages 3+.',
                        'description_ar' => 'تابلت تعليمي تفاعلي بمحتوى عربي وإنجليزي. ألعاب تعليمية وأغاني وأنشطة. للأعمار 3+.',
                        'price' => 32,
                        'stock' => 30,
                        'image' => 'kids-learning-tablet.webp',
                    ],
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $this->command->info("Creating category: {$categoryData['name']}");

            // Create category
            $category = Category::firstOrCreate(
                ['slug' => $categoryData['slug']],
                [
                    'name' => $categoryData['name'],
                    'name_ar' => $categoryData['name_ar'],
                    'description' => $categoryData['description'],
                    'description_ar' => $categoryData['description_ar'],
                    'sort_order' => $categoryData['sort_order'],
                    'is_active' => true,
                ]
            );

            // Create products
            foreach ($categoryData['products'] as $productData) {
                $slug = Str::slug($productData['name']);

                // Skip if product already exists
                if (Product::where('slug', $slug)->exists()) {
                    $this->command->info("  Skipping existing product: {$productData['name']}");
                    continue;
                }

                $product = Product::create([
                    'category_id' => $category->id,
                    'name' => $productData['name'],
                    'name_ar' => $productData['name_ar'],
                    'slug' => $slug,
                    'description' => $productData['description'],
                    'description_ar' => $productData['description_ar'],
                    'short_description' => Str::limit($productData['description'], 150),
                    'short_description_ar' => Str::limit($productData['description_ar'], 150),
                    'price' => $productData['price'],
                    'compare_price' => null,
                    'sku' => strtoupper(Str::random(3)) . '-' . rand(1000, 9999),
                    'stock' => $productData['stock'],
                    'is_active' => true,
                    'is_featured' => false,
                    'times_purchased' => rand(20, 100),
                    'average_rating' => rand(40, 50) / 10,
                    'rating_count' => rand(15, 80),
                    'view_count' => rand(200, 800),
                ]);

                // Create product image
                $imagePath = "products/{$categoryData['image_folder']}/{$productData['image']}";

                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $imagePath,
                    'alt_text' => $productData['name'],
                    'sort_order' => 0,
                    'is_primary' => true,
                ]);

                $this->command->info("  Created product: {$productData['name']}");
            }
        }

        $this->command->info("New categories seeding completed!");
    }
}
