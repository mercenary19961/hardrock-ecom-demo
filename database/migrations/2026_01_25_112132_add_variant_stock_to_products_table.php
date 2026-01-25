<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds variant stock system for products with multiple colors and sizes.
     *
     * available_colors: JSON array of color objects
     *   e.g., [{"name": "Black", "hex": "#000000"}, {"name": "Red", "hex": "#FF0000"}]
     *
     * variant_stock: JSON object with color_size composite keys
     *   e.g., {"black_S": 10, "black_M": 15, "red_S": 8, "red_M": 12}
     *
     * Existing size_stock column is kept for backward compatibility with
     * products that only have sizes (no color variants).
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // JSON array of available colors: [{name: "Black", hex: "#000000"}, ...]
            $table->json('available_colors')->nullable()->after('color_hex');

            // JSON object with variant stock: {"black_S": 10, "black_M": 15, ...}
            $table->json('variant_stock')->nullable()->after('size_stock');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['available_colors', 'variant_stock']);
        });
    }
};
