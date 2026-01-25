<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            // Color name that this image represents (e.g., "Black", "Navy Blue")
            // Nullable - images without a color are shown for all colors
            $table->string('color', 100)->nullable()->after('is_primary');

            // Index for filtering images by color
            $table->index(['product_id', 'color']);
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->dropIndex(['product_id', 'color']);
            $table->dropColumn('color');
        });
    }
};
