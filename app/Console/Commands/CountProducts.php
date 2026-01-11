<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class CountProducts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:count-stats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Count unique products and stats';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $total = Product::count();
        $outOfStock = Product::where('stock', '<=', 0)->count();
        
        // Count unique "models" (grouping variants)
        // Products with a group are counted once per group
        $groupedCount = Product::whereNotNull('product_group')->distinct('product_group')->count('product_group');
        // Products without a group are counted individually
        $singleCount = Product::whereNull('product_group')->count();
        $uniqueModels = $groupedCount + $singleCount;

        $this->info("Total Product Records: $total");
        $this->info("Out of Stock: $outOfStock");
        $this->info("Unique Models (Grouping Variants): $uniqueModels");
        
        return 0;
    }
}
