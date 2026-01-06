<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$product = App\Models\Product::where('name', 'like', '%A7Vs%')->first();
if ($product) {
    echo "Product: {$product->name}" . PHP_EOL;
    echo "SKU: {$product->sku}" . PHP_EOL;
    
    $images = $product->images;
    echo "Images count: " . $images->count() . PHP_EOL;
    
    foreach ($images as $img) {
        $publicPath = public_path('images/' . $img->path);
        $exists = file_exists($publicPath) ? 'EXISTS' : 'MISSING';
        echo "  Path: {$img->path}" . PHP_EOL;
        echo "  Full path: {$publicPath}" . PHP_EOL;
        echo "  File: {$exists}" . PHP_EOL;
        echo "  URL: {$img->url}" . PHP_EOL;
    }
} else {
    echo "Product not found" . PHP_EOL;
}
