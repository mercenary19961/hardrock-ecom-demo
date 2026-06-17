<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The original payment_method was an enum ('card','paypal','cod').
        // Relax it to a string so gateway identifiers like 'moyasar', 'mada',
        // 'applepay', 'stcpay' can be stored.
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method')->default('cod')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            // Which gateway is handling this order (moyasar, tap, tamara, ...)
            $table->string('payment_provider')->nullable()->after('payment_method');
            // Gateway-side reference (Moyasar invoice id) used to reconcile.
            $table->string('payment_ref')->nullable()->after('transaction_id');
            // Hosted checkout URL the customer was sent to (for re-prompting).
            $table->string('payment_url', 1024)->nullable()->after('payment_ref');
            // Guards stock restoration so it can only ever happen once per order.
            $table->boolean('stock_restored')->default(false)->after('payment_url');

            $table->index(['payment_status', 'payment_method', 'status'], 'orders_payment_lookup_idx');
            $table->index('payment_ref');
        });

        // Full audit trail + idempotency anchor for every gateway charge attempt.
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('moyasar');
            // Moyasar invoice id (groups payment attempts for one order).
            $table->string('invoice_id')->nullable();
            // Moyasar payment id. UNIQUE => the idempotency key for webhooks.
            $table->string('payment_id')->nullable()->unique();
            $table->string('status')->default('initiated');
            // Amount stored in minor units (halalas) to match the gateway exactly.
            $table->unsignedBigInteger('amount');
            $table->string('currency', 3)->default('SAR');
            // creditcard / applepay / stcpay
            $table->string('source_type')->nullable();
            // mada / visa / master / ...
            $table->string('source_company')->nullable();
            $table->text('failure_message')->nullable();
            // Raw normalized gateway response for debugging / disputes.
            $table->json('raw')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'status']);
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_payment_lookup_idx');
            $table->dropIndex(['payment_ref']);
            $table->dropColumn([
                'payment_provider',
                'payment_ref',
                'payment_url',
                'stock_restored',
            ]);
        });
    }
};
