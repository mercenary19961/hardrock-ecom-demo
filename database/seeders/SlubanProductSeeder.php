<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SlubanProductSeeder extends Seeder
{
    // SKUs to skip (products with missing images)
    private array $skipSkus = [
        'M38-B1287',  // Metropolis-Rescue Headquarters 407pcs
        'M38-B1290',  // Metropolis-Indoor Express 255pcs
        'M38-B1259',  // ARMY-Operation Hunt and Eliminate - Raid 557pcs
        'M38-B1257',  // ARMY-IFR-T90AS Main Battle Tank 318pcs
        'M38-P8062',  // PLEYERID-Sunflower (Plated vases) 288pcs
        'M38-B1329',  // Metropolis-Girl-4 types
        'M38-B1296',  // ARMY WWI – Mark V Tank Offensive Action – 516 PCS
        'M38-B1295',  // ARMY WWI-A7Vs Tank Offensive action 506pcs
        'M38-B1293',  // ModelBricks – 1/35 Sopwith Camel S – 293 PCS
        'M38-B0708',  // ModelBricks- London bus (382pcs)
        'M38-B1213',  // Metropolis-Doctor- Rescue (Pull back)
        'M38-B1193',  // ModelBricks- 1/35 TS-3 RV 506pcs
    ];

    public function run(): void
    {
        // Create parent category "Building Blocks"
        $buildingBlocks = Category::firstOrCreate(
            ['slug' => 'building-blocks'],
            [
                'name' => 'Building Blocks',
                'name_ar' => 'مكعبات البناء',
                'description' => 'Construction and building block sets for creative play',
                'description_ar' => 'مجموعات البناء والتركيب للعب الإبداعي',
                'image' => 'categories/building-blocks.webp',
                'sort_order' => 3,
                'is_active' => true,
            ]
        );

        // Create sub-category "Building Models"
        $buildingModels = Category::firstOrCreate(
            ['slug' => 'building-models'],
            [
                'name' => 'Building Models',
                'name_ar' => 'نماذج البناء',
                'description' => 'Detailed building model sets',
                'description_ar' => 'مجموعات نماذج البناء المفصلة',
                'parent_id' => $buildingBlocks->id,
                'sort_order' => 1,
                'is_active' => true,
            ]
        );

        // Read and parse CSV file
        $csvPath = base_path('../../../Users/sabba/Downloads/sulban new - Sheet1.csv');

        // Alternative path if running from different location
        if (!file_exists($csvPath)) {
            $csvPath = 'c:/Users/sabba/Downloads/sulban new - Sheet1.csv';
        }

        $csvContent = file_get_contents($csvPath);
        $rows = $this->parseCSV($csvContent);

        $headers = $rows[0];
        $dataRows = array_slice($rows, 1);

        $this->command->info("Found " . count($dataRows) . " products to import");

        foreach ($dataRows as $index => $row) {
            $data = array_combine($headers, $row);

            if (empty($data['SKU']) || empty($data['name_en'])) {
                continue;
            }

            // Skip products with missing images
            if (in_array($data['SKU'], $this->skipSkus)) {
                $this->command->info("Skipping product with missing image: {$data['SKU']}");
                continue;
            }

            // Check if product already exists
            if (Product::where('sku', $data['SKU'])->exists()) {
                $this->command->info("Skipping existing product: {$data['SKU']}");
                continue;
            }

            $price = floatval($data['price'] ?? 0);
            $stock = intval($data['stock'] ?? 0);

            $product = Product::create([
                'category_id' => $buildingModels->id,
                'name' => $data['name_en'],
                'name_ar' => $data['name_ar'] ?? null,
                'slug' => Str::slug($data['name_en']),
                'description' => $data['description_en'] ?? null,
                'description_ar' => $data['description_ar'] ?? null,
                'short_description' => Str::limit($data['description_en'] ?? '', 200),
                'short_description_ar' => Str::limit($data['description_ar'] ?? '', 200),
                'price' => $price,
                'compare_price' => null,
                'sku' => $data['SKU'],
                'stock' => $stock,
                'is_active' => true,
                'is_featured' => false,
                'times_purchased' => rand(10, 100),
                'average_rating' => rand(35, 50) / 10,
                'rating_count' => rand(5, 50),
                'view_count' => rand(100, 500),
            ]);

            // Create product images
            $this->createProductImages($product, $data);

            $this->command->info("Created product: {$data['SKU']} - {$data['name_en']}");
        }

        $this->command->info("Sluban product import completed!");
    }

    private function createProductImages(Product $product, array $data): void
    {
        $imagesPath = 'products/sluban';
        $sortOrder = 0;

        // Primary image from thumbnail_name
        $thumbnail = trim($data['thumbnail_name'] ?? '');
        if ($thumbnail) {
            // Convert to webp and clean filename
            $thumbnailWebp = $this->cleanImageName($thumbnail);

            if ($this->imageExists($thumbnailWebp)) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => "{$imagesPath}/{$thumbnailWebp}",
                    'alt_text' => $product->name,
                    'sort_order' => $sortOrder++,
                    'is_primary' => true,
                ]);
            }
        }

        // Additional images from image_names
        $imageNames = trim($data['image_names'] ?? '');
        if ($imageNames) {
            $images = array_map('trim', explode(',', $imageNames));

            foreach ($images as $imageName) {
                if (empty($imageName)) continue;

                $imageWebp = $this->cleanImageName($imageName);

                if ($this->imageExists($imageWebp)) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => "{$imagesPath}/{$imageWebp}",
                        'alt_text' => $product->name,
                        'sort_order' => $sortOrder++,
                        'is_primary' => false,
                    ]);
                }
            }
        }
    }

    private function cleanImageName(string $name): string
    {
        // Remove any extension and add .webp
        $name = preg_replace('/\.(webp|jpg|jpeg|png)$/i', '', $name);
        // Remove .jpg from names like "M38-B1290-1.jpg.webp"
        $name = preg_replace('/\.jpg$/i', '', $name);
        return $name . '.webp';
    }

    private function imageExists(string $filename): bool
    {
        $path = public_path("images/products/sluban/{$filename}");
        return file_exists($path);
    }

    private function parseCSV(string $text): array
    {
        $rows = [];
        $currentRow = [];
        $currentField = '';
        $insideQuotes = false;
        $len = strlen($text);

        for ($i = 0; $i < $len; $i++) {
            $char = $text[$i];

            if ($char === '"') {
                if ($insideQuotes && isset($text[$i + 1]) && $text[$i + 1] === '"') {
                    $currentField .= '"';
                    $i++;
                } else {
                    $insideQuotes = !$insideQuotes;
                }
            } elseif ($char === ',' && !$insideQuotes) {
                $currentRow[] = $currentField;
                $currentField = '';
            } elseif (($char === "\n" || $char === "\r") && !$insideQuotes) {
                if ($char === "\r" && isset($text[$i + 1]) && $text[$i + 1] === "\n") {
                    $i++;
                }
                if ($currentField !== '' || count($currentRow) > 0) {
                    $currentRow[] = $currentField;
                    $rows[] = $currentRow;
                    $currentRow = [];
                    $currentField = '';
                }
            } else {
                $currentField .= $char;
            }
        }

        if ($currentField !== '' || count($currentRow) > 0) {
            $currentRow[] = $currentField;
            $rows[] = $currentRow;
        }

        return $rows;
    }
}
