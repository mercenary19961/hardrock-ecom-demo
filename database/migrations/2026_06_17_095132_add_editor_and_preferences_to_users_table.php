<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Extend role enum to include editor
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'customer') NOT NULL DEFAULT 'customer'");

        Schema::table('users', function (Blueprint $table) {
            $table->json('permissions')->nullable()->after('role');
            $table->json('notification_preferences')->nullable()->after('permissions');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['permissions', 'notification_preferences']);
        });

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer'");
    }
};
