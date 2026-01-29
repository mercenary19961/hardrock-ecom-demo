<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Verify all existing users so they aren't blocked by the new verification requirement.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    /**
     * Reverse the migrations.
     * Note: We don't reverse this as we can't know which users were originally unverified.
     */
    public function down(): void
    {
        // Intentionally left empty - cannot reliably reverse
    }
};
