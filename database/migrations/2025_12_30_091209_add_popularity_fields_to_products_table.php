<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('times_purchased')->default(0)->after('is_featured');
            $table->decimal('average_rating', 2, 1)->default(0)->after('times_purchased');
            $table->unsignedInteger('rating_count')->default(0)->after('average_rating');
            $table->unsignedInteger('view_count')->default(0)->after('rating_count');

            $table->index('times_purchased');
            $table->index('average_rating');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['times_purchased']);
            $table->dropIndex(['average_rating']);
            $table->dropColumn(['times_purchased', 'average_rating', 'rating_count', 'view_count']);
        });
    }
};
