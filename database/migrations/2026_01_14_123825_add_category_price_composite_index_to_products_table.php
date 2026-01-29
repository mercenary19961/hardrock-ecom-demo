<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Check if an index exists on a table (database-agnostic)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND name = ?", [$indexName]);
            return count($indexes) > 0;
        }

        // MySQL / MariaDB
        $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }

    /**
     * Run the migrations.
     *
     * Adds composite index for optimizing price range and discount calculations
     * in category pages. This index supports:
     * - getPriceRange() - MIN/MAX price queries
     * - getMaxDiscount() - discount percentage calculations
     * - getDiscountBrackets() - discount bracket aggregations
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Composite index for price range queries (MIN/MAX price in category)
            if (!$this->indexExists('products', 'products_category_price_idx')) {
                $table->index(
                    ['category_id', 'is_active', 'price'],
                    'products_category_price_idx'
                );
            }

            // Composite index for discount calculations
            // Covers queries that need compare_price and price together
            if (!$this->indexExists('products', 'products_category_discount_idx')) {
                $table->index(
                    ['category_id', 'is_active', 'compare_price', 'price'],
                    'products_category_discount_idx'
                );
            }

            // Index for color filter queries
            if (!$this->indexExists('products', 'products_category_color_idx')) {
                $table->index(
                    ['category_id', 'is_active', 'color'],
                    'products_category_color_idx'
                );
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if ($this->indexExists('products', 'products_category_price_idx')) {
                $table->dropIndex('products_category_price_idx');
            }
            if ($this->indexExists('products', 'products_category_discount_idx')) {
                $table->dropIndex('products_category_discount_idx');
            }
            if ($this->indexExists('products', 'products_category_color_idx')) {
                $table->dropIndex('products_category_color_idx');
            }
        });
    }
};
