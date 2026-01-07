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
            // Color for the product (e.g., "black", "white", "red", "grey")
            $table->string('color')->nullable()->after('sku');
            // Hex code for color display (e.g., "#000000", "#FFFFFF")
            $table->string('color_hex')->nullable()->after('color');
            // Available sizes as JSON array (e.g., ["S", "M", "L", "XL"])
            $table->json('available_sizes')->nullable()->after('color_hex');
            // Stock per size as JSON object (e.g., {"S": 10, "M": 25, "L": 20})
            $table->json('size_stock')->nullable()->after('available_sizes');
            // Group related products (same product, different colors)
            $table->string('product_group')->nullable()->after('size_stock')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['color', 'color_hex', 'available_sizes', 'size_stock', 'product_group']);
        });
    }
};
