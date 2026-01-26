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
        Schema::table('cart_items', function (Blueprint $table) {
            // Drop the old unique constraint on just cart_id + product_id
            // This allows same product with different variants as separate cart items
            $table->dropUnique(['cart_id', 'product_id']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->string('color')->nullable()->after('quantity');
            $table->string('color_hex')->nullable()->after('color');
            $table->string('size')->nullable()->after('color_hex');
            $table->unsignedBigInteger('selected_image_id')->nullable()->after('size');

            // Add new unique constraint for product + color + size combination
            $table->unique(['cart_id', 'product_id', 'color', 'size'], 'cart_items_variant_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique('cart_items_variant_unique');
            $table->dropColumn(['color', 'color_hex', 'size', 'selected_image_id']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            // Restore the old unique constraint
            $table->unique(['cart_id', 'product_id']);
        });
    }
};
