<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdditionalProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Fashion & Accessories
            [
                'category_slug' => 'fashion',
                'image_folder' => 'fashion',
                'name' => 'Minimalist Silver Bracelet',
                'name_ar' => 'سوار فضي بسيط',
                'description' => 'Elegant sterling silver bracelet with minimalist design. Adjustable chain length, hypoallergenic, perfect for everyday wear.',
                'description_ar' => 'سوار فضة استرليني أنيق بتصميم بسيط. طول سلسلة قابل للتعديل، مضاد للحساسية، مثالي للاستخدام اليومي.',
                'price' => 18,
                'stock' => 50,
                'image' => 'minimalist-silver-bracelet.webp',
            ],
            [
                'category_slug' => 'fashion',
                'image_folder' => 'fashion',
                'name' => 'Canvas Tote Bag',
                'name_ar' => 'حقيبة توت قماشية',
                'description' => 'Durable cotton canvas tote bag with inner pocket. Eco-friendly, reusable, great for shopping or daily use.',
                'description_ar' => 'حقيبة توت من القماش القطني المتين مع جيب داخلي. صديقة للبيئة، قابلة لإعادة الاستخدام، رائعة للتسوق أو الاستخدام اليومي.',
                'price' => 15,
                'stock' => 60,
                'image' => 'canvas-tote-bag.webp',
            ],
            [
                'category_slug' => 'fashion',
                'image_folder' => 'fashion',
                'name' => 'Leather Belt',
                'name_ar' => 'حزام جلدي',
                'description' => 'Classic genuine leather belt with brushed metal buckle. Available in multiple sizes, durable and stylish.',
                'description_ar' => 'حزام جلد طبيعي كلاسيكي مع إبزيم معدني مصقول. متوفر بمقاسات متعددة، متين وأنيق.',
                'price' => 22,
                'stock' => 40,
                'image' => 'leather-belt.webp',
            ],
            [
                'category_slug' => 'fashion',
                'image_folder' => 'fashion',
                'name' => 'Wool Beanie Hat',
                'name_ar' => 'قبعة صوف',
                'description' => 'Soft merino wool beanie hat for winter. Warm, breathable, and comfortable fit for all head sizes.',
                'description_ar' => 'قبعة صوف ميرينو ناعمة للشتاء. دافئة، قابلة للتنفس، ومريحة لجميع أحجام الرأس.',
                'price' => 12,
                'stock' => 55,
                'image' => 'wool-beanie-hat.webp',
            ],

            // Home & Kitchen
            [
                'category_slug' => 'home-kitchen',
                'image_folder' => 'home-kitchen',
                'name' => 'Electric Kettle 1.7L',
                'name_ar' => 'غلاية كهربائية 1.7 لتر',
                'description' => 'Fast boiling electric kettle with auto shut-off and boil-dry protection. Stainless steel interior, BPA-free.',
                'description_ar' => 'غلاية كهربائية سريعة الغليان مع إيقاف تلقائي وحماية من الغليان الجاف. داخلية ستانلس ستيل، خالية من BPA.',
                'price' => 28,
                'stock' => 35,
                'image' => 'electric-kettle.webp',
            ],
            [
                'category_slug' => 'home-kitchen',
                'image_folder' => 'home-kitchen',
                'name' => 'Bamboo Cutting Board Set',
                'name_ar' => 'طقم ألواح تقطيع خيزران',
                'description' => 'Set of 3 organic bamboo cutting boards in different sizes. Knife-friendly surface, easy to clean, with juice grooves.',
                'description_ar' => 'طقم من 3 ألواح تقطيع خيزران عضوي بأحجام مختلفة. سطح لطيف على السكاكين، سهل التنظيف، مع أخاديد للعصائر.',
                'price' => 20,
                'stock' => 40,
                'image' => 'bamboo-cutting-board-set.webp',
            ],
            [
                'category_slug' => 'home-kitchen',
                'image_folder' => 'home-kitchen',
                'name' => 'Stainless Steel Knife Set',
                'name_ar' => 'طقم سكاكين ستانلس ستيل',
                'description' => 'Professional 6-piece knife set with wooden block. High-carbon stainless steel blades, ergonomic handles.',
                'description_ar' => 'طقم سكاكين احترافي 6 قطع مع حامل خشبي. شفرات ستانلس ستيل عالية الكربون، مقابض مريحة.',
                'price' => 35,
                'stock' => 25,
                'image' => 'stainless-steel-knife-set.webp',
            ],
            [
                'category_slug' => 'home-kitchen',
                'image_folder' => 'home-kitchen',
                'name' => 'Glass Food Storage Containers',
                'name_ar' => 'حافظات طعام زجاجية',
                'description' => 'Set of 5 borosilicate glass containers with airtight lids. Microwave, oven, freezer, and dishwasher safe.',
                'description_ar' => 'طقم من 5 حافظات زجاجية بوروسيليكات مع أغطية محكمة. آمنة للميكروويف والفرن والفريزر وغسالة الصحون.',
                'price' => 24,
                'stock' => 30,
                'image' => 'glass-food-containers.webp',
            ],

            // Sports & Outdoors
            [
                'category_slug' => 'sports',
                'image_folder' => 'sports',
                'name' => 'Adjustable Dumbbell Set',
                'name_ar' => 'طقم دمبل قابل للتعديل',
                'description' => 'Space-saving adjustable dumbbells from 2.5kg to 12.5kg each. Quick-change weight system, anti-slip grip.',
                'description_ar' => 'دمبل قابل للتعديل موفر للمساحة من 2.5 كجم إلى 12.5 كجم لكل واحد. نظام تغيير وزن سريع، قبضة مانعة للانزلاق.',
                'price' => 45,
                'stock' => 20,
                'image' => 'adjustable-dumbbell-set.webp',
            ],
            [
                'category_slug' => 'sports',
                'image_folder' => 'sports',
                'name' => 'Jump Rope',
                'name_ar' => 'حبل قفز',
                'description' => 'Speed jump rope with ball bearings for smooth rotation. Adjustable length, comfortable foam handles.',
                'description_ar' => 'حبل قفز سريع مع محامل كروية لدوران سلس. طول قابل للتعديل، مقابض فوم مريحة.',
                'price' => 8,
                'stock' => 70,
                'image' => 'jump-rope.webp',
            ],
            [
                'category_slug' => 'sports',
                'image_folder' => 'sports',
                'name' => 'Sports Gym Bag',
                'name_ar' => 'حقيبة رياضية',
                'description' => 'Large capacity gym bag with shoe compartment and wet pocket. Water-resistant fabric, adjustable shoulder strap.',
                'description_ar' => 'حقيبة رياضية كبيرة السعة مع جيب للأحذية وجيب للملابس المبللة. قماش مقاوم للماء، حزام كتف قابل للتعديل.',
                'price' => 25,
                'stock' => 35,
                'image' => 'sports-gym-bag.webp',
            ],
            [
                'category_slug' => 'sports',
                'image_folder' => 'sports',
                'name' => 'Foam Roller',
                'name_ar' => 'أسطوانة فوم للتمارين',
                'description' => 'High-density foam roller for muscle recovery and massage. Textured surface for deep tissue relief, 45cm length.',
                'description_ar' => 'أسطوانة فوم عالية الكثافة لاستعادة العضلات والتدليك. سطح محبب لتخفيف الأنسجة العميقة، طول 45 سم.',
                'price' => 14,
                'stock' => 45,
                'image' => 'foam-roller.webp',
            ],

            // Books & Stationery
            [
                'category_slug' => 'stationery',
                'image_folder' => 'stationery',
                'name' => 'Watercolor Paint Set',
                'name_ar' => 'طقم ألوان مائية',
                'description' => 'Professional watercolor set with 24 vibrant colors. Includes palette, brushes, and portable case.',
                'description_ar' => 'طقم ألوان مائية احترافي مع 24 لوناً زاهياً. يشمل لوحة وفرش وحقيبة محمولة.',
                'price' => 22,
                'stock' => 30,
                'image' => 'watercolor-paint-set.webp',
            ],
            [
                'category_slug' => 'stationery',
                'image_folder' => 'stationery',
                'name' => 'Sticky Notes Variety Pack',
                'name_ar' => 'مجموعة ملصقات لاصقة',
                'description' => 'Colorful sticky notes in various sizes and shapes. 500 sheets total, perfect for organization and reminders.',
                'description_ar' => 'ملصقات لاصقة ملونة بأحجام وأشكال متنوعة. 500 ورقة إجمالاً، مثالية للتنظيم والتذكيرات.',
                'price' => 8,
                'stock' => 80,
                'image' => 'sticky-notes-pack.webp',
            ],
            [
                'category_slug' => 'stationery',
                'image_folder' => 'stationery',
                'name' => 'Mechanical Pencil Set',
                'name_ar' => 'طقم أقلام رصاص ميكانيكية',
                'description' => 'Set of 4 mechanical pencils with different lead sizes (0.3, 0.5, 0.7, 0.9mm). Includes lead refills and erasers.',
                'description_ar' => 'طقم من 4 أقلام رصاص ميكانيكية بأحجام سن مختلفة (0.3، 0.5، 0.7، 0.9 ملم). يشمل عبوات سن وممحاة.',
                'price' => 12,
                'stock' => 50,
                'image' => 'mechanical-pencil-set.webp',
            ],
            [
                'category_slug' => 'stationery',
                'image_folder' => 'stationery',
                'name' => 'A4 Sketchbook 100 Pages',
                'name_ar' => 'دفتر رسم A4 - 100 صفحة',
                'description' => 'Premium A4 sketchbook with 100 pages of acid-free paper. 160gsm weight, suitable for pencil, charcoal, and light markers.',
                'description_ar' => 'دفتر رسم A4 فاخر مع 100 صفحة من الورق الخالي من الحمض. وزن 160 جرام، مناسب للقلم الرصاص والفحم والأقلام الخفيفة.',
                'price' => 10,
                'stock' => 55,
                'image' => 'a4-sketchbook.webp',
            ],

            // Baby & Kids
            [
                'category_slug' => 'kids',
                'image_folder' => 'kids',
                'name' => 'Plush Teddy Bear',
                'name_ar' => 'دبدوب قطيفة',
                'description' => 'Soft and cuddly plush teddy bear, 30cm tall. Made with child-safe materials, machine washable.',
                'description_ar' => 'دبدوب قطيفة ناعم ومحبوب، ارتفاع 30 سم. مصنوع من مواد آمنة للأطفال، قابل للغسيل في الغسالة.',
                'price' => 16,
                'stock' => 45,
                'image' => 'plush-teddy-bear.webp',
            ],
            [
                'category_slug' => 'kids',
                'image_folder' => 'kids',
                'name' => 'Kids Puzzle Set 100pc',
                'name_ar' => 'بازل أطفال 100 قطعة',
                'description' => 'Colorful 100-piece jigsaw puzzle with fun design. Large pieces for small hands, develops problem-solving skills.',
                'description_ar' => 'بازل 100 قطعة ملونة بتصميم ممتع. قطع كبيرة للأيدي الصغيرة، تطور مهارات حل المشكلات.',
                'price' => 12,
                'stock' => 40,
                'image' => 'kids-puzzle-set.webp',
            ],
            [
                'category_slug' => 'kids',
                'image_folder' => 'kids',
                'name' => 'Baby Sippy Cup',
                'name_ar' => 'كوب أطفال بمقبض',
                'description' => 'Spill-proof sippy cup with easy-grip handles. BPA-free, dishwasher safe, 240ml capacity. Ages 6+ months.',
                'description_ar' => 'كوب أطفال مانع للانسكاب مع مقابض سهلة الإمساك. خالي من BPA، آمن لغسالة الصحون، سعة 240 مل. للأعمار 6+ أشهر.',
                'price' => 8,
                'stock' => 60,
                'image' => 'baby-sippy-cup.webp',
            ],
            [
                'category_slug' => 'kids',
                'image_folder' => 'kids',
                'name' => 'Coloring Book Set',
                'name_ar' => 'مجموعة كتب تلوين',
                'description' => 'Set of 4 coloring books with crayons. Features animals, vehicles, nature, and characters. Ages 3+.',
                'description_ar' => 'مجموعة من 4 كتب تلوين مع أقلام شمع. تتضمن حيوانات ومركبات وطبيعة وشخصيات. للأعمار 3+.',
                'price' => 10,
                'stock' => 50,
                'image' => 'coloring-book-set.webp',
            ],
        ];

        foreach ($products as $productData) {
            $category = Category::where('slug', $productData['category_slug'])->first();

            if (!$category) {
                $this->command->error("Category not found: {$productData['category_slug']}");
                continue;
            }

            $slug = Str::slug($productData['name']);

            // Skip if product already exists
            if (Product::where('slug', $slug)->exists()) {
                $this->command->info("Skipping existing product: {$productData['name']}");
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
                'times_purchased' => rand(15, 80),
                'average_rating' => rand(38, 50) / 10,
                'rating_count' => rand(10, 60),
                'view_count' => rand(150, 600),
            ]);

            // Create product image
            $imagePath = "products/{$productData['image_folder']}/{$productData['image']}";

            ProductImage::create([
                'product_id' => $product->id,
                'path' => $imagePath,
                'alt_text' => $productData['name'],
                'sort_order' => 0,
                'is_primary' => true,
            ]);

            $this->command->info("Created product: {$productData['name']}");
        }

        $this->command->info("Additional products seeding completed!");
    }
}
