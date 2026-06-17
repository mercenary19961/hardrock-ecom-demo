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
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->timestamp('reverted_at')->nullable()->after('user_id');
            $table->unsignedBigInteger('reverted_by')->nullable()->after('reverted_at');

            $table->foreign('reverted_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropForeign(['reverted_by']);
            $table->dropColumn(['reverted_at', 'reverted_by']);
        });
    }
};
