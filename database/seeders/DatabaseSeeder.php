<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,              // Electronics & Skincare products
            AdditionalProductsSeeder::class,   // More products for Fashion, Home & Kitchen, Sports, Stationery, Kids
            NewCategoriesSeeder::class,        // Additional products for all categories (uses firstOrCreate, no conflicts)
            SlubanProductSeeder::class,        // Building Blocks (Sluban) products
            FashionVariantSeeder::class,       // Fashion variants (Hoodie with colors/sizes)
            BuildingBlocksSubcategoriesSeeder::class, // Categorize Building Blocks products into subcategories
            ProductSubcategoriesSeeder::class, // Redistribute products from parent categories into subcategories
            SaleProductsSeeder::class,         // Add sale discounts to products
            OrderSeeder::class,
            ReviewSeeder::class,               // Demo reviews for products
        ]);
    }
}
