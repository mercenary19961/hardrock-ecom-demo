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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('model_type', 50); // Product, Category, Order, etc.
            $table->unsignedBigInteger('model_id');
            $table->string('model_name')->nullable(); // Store the name for display even if deleted
            $table->string('action', 20); // created, updated, deleted, restored
            $table->json('changes')->nullable(); // JSON of field changes
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            // Indexes for efficient querying
            $table->index(['model_type', 'model_id']);
            $table->index(['user_id']);
            $table->index(['action']);
            $table->index(['created_at']);

            // Foreign key for user (nullable for system actions)
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
