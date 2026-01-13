<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Index for category filtering (most common filter)
            $table->index(['category_id', 'is_active'], 'products_category_active_idx');

            // Index for sale products (compare_price filtering)
            $table->index(['is_active', 'compare_price'], 'products_active_sale_idx');

            // Index for sorting by popularity
            $table->index(['is_active', 'times_purchased'], 'products_active_popular_idx');

            // Index for sorting by newest
            $table->index(['is_active', 'created_at'], 'products_active_newest_idx');

            // Index for price range filtering
            $table->index(['is_active', 'price'], 'products_active_price_idx');
        });

        Schema::table('categories', function (Blueprint $table) {
            // Index for active parent categories
            $table->index(['is_active', 'parent_id'], 'categories_active_parent_idx');

            // Index for slug lookups
            $table->index('slug', 'categories_slug_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_active_idx');
            $table->dropIndex('products_active_sale_idx');
            $table->dropIndex('products_active_popular_idx');
            $table->dropIndex('products_active_newest_idx');
            $table->dropIndex('products_active_price_idx');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_active_parent_idx');
            $table->dropIndex('categories_slug_idx');
        });
    }
};
