<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Which shipping aggregator handled fulfillment (oto, ...).
            $table->string('shipping_provider')->nullable()->after('carrier');
            // OTO's internal order id (returned by createOrder) used to manage
            // the shipment afterwards.
            $table->unsignedBigInteger('oto_id')->nullable()->after('shipping_provider');
            // URL to the AWB / shipping label PDF for printing.
            $table->string('shipping_label_url', 1024)->nullable()->after('oto_id');

            $table->index('oto_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['oto_id']);
            $table->dropColumn(['shipping_provider', 'oto_id', 'shipping_label_url']);
        });
    }
};
