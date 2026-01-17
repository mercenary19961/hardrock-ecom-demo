<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes to improve query performance for reviews and cart_items
     */
    public function up(): void
    {
        // Add indexes to reviews table for faster pagination and user review checks
        Schema::table('reviews', function (Blueprint $table) {
            // Index for review pagination (product_id + created_at for ORDER BY)
            $table->index(['product_id', 'created_at'], 'reviews_product_created_idx');

            // Index for checking if user already reviewed a product
            $table->index(['product_id', 'user_id'], 'reviews_product_user_idx');
        });

        // Add indexes to cart_items table for faster lookups
        Schema::table('cart_items', function (Blueprint $table) {
            // Index for finding items by product
            $table->index('product_id', 'cart_items_product_idx');

            // Composite index for cart + product lookups (checking if product is in cart)
            $table->index(['cart_id', 'product_id'], 'cart_items_cart_product_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_product_created_idx');
            $table->dropIndex('reviews_product_user_idx');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex('cart_items_product_idx');
            $table->dropIndex('cart_items_cart_product_idx');
        });
    }
};
