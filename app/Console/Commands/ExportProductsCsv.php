<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ExportProductsCsv extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:export-csv';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export all products to a CSV file in the project root';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting product export...');

        // Eager load category, its parent, and images
        $products = Product::with(['category.parent', 'primaryImage', 'images'])->get();
        $filename = 'products_export_' . date('Y-m-d_H-i-s') . '.csv';
        $path = base_path($filename);

        $handle = fopen($path, 'w');

        // Add UTF-8 BOM for Excel compatibility
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

        // CSV Headers
        fputcsv($handle, [
            'ID',
            'Name',
            'Mini Description',
            'Description',
            'SKU',
            'Price',
            'Compare Price',
            'Price After Sale',
            'On Sale',
            'Stock',
            'Category',
            'Subcategory',
            'Image Name',
            'All Images',
            'Active',
            'Featured',
            'Created At'
        ]);

        $bar = $this->output->createProgressBar(count($products));
        $bar->start();

        foreach ($products as $product) {
            $categoryName = 'N/A';
            $subcategoryName = '';

            if ($product->category) {
                if ($product->category->parent) {
                    // Assigned category is a subcategory
                    $categoryName = $product->category->parent->name;
                    $subcategoryName = $product->category->name;
                } else {
                    // Assigned category is a main category
                    $categoryName = $product->category->name;
                    $subcategoryName = '';
                }
            }

            // Price After Sale logic
            $priceAfterSale = $product->price;

            // On Sale logic
            $onSale = ($product->compare_price && $product->compare_price > $product->price) ? 'Yes' : 'No';

            // Image logic: Rename based on product name
            // Sort so primary is first, then by sort_order
            $images = $product->images->sortBy('sort_order');
            if ($product->primaryImage) {
                // Ensure primary is strictly first if logical sorting didn't catch it
                $images = $images->reject(fn($i) => $i->id === $product->primaryImage->id)
                                 ->prepend($product->primaryImage);
            }

            $renamedImages = [];
            $counter = 1;
            $slug = Str::slug($product->name);

            foreach ($images as $img) {
                $ext = pathinfo($img->path, PATHINFO_EXTENSION);
                
                if ($counter === 1) {
                    $newName = "{$slug}.{$ext}";
                } else {
                    $newName = "{$slug}-{$counter}.{$ext}";
                }
                
                $renamedImages[] = $newName;
                $counter++;
            }

            $imageName = $renamedImages[0] ?? '';
            $allImageNames = implode(', ', $renamedImages);

            fputcsv($handle, [
                $product->id,
                $product->name,
                $product->short_description,
                $product->description,
                $product->sku,
                round($product->price),
                $product->compare_price ? round($product->compare_price) : '',
                round($priceAfterSale),
                $onSale,
                $product->stock,
                $categoryName,
                $subcategoryName,
                $imageName,
                $allImageNames,
                $product->is_active ? 'Yes' : 'No',
                $product->is_featured ? 'Yes' : 'No',
                $product->created_at->toDateTimeString(),
            ]);
            $bar->advance();
        }

        $bar->finish();
        fclose($handle);

        $this->newLine();
        $this->info("Products exported successfully to: {$filename}");
        
        return 0;
    }
}
