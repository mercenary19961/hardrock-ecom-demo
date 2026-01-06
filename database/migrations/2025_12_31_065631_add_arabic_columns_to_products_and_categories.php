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
        // Add Arabic columns to categories table
        Schema::table('categories', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->text('description_ar')->nullable()->after('description');
        });

        // Add Arabic columns to products table
        Schema::table('products', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->text('description_ar')->nullable()->after('description');
            $table->string('short_description_ar', 500)->nullable()->after('short_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'description_ar']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'description_ar', 'short_description_ar']);
        });
    }
};
