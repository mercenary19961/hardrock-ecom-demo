<?php

namespace App\Services\Payments\Concerns;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

/**
 * Shared order <-> payment fulfillment primitives used by every gateway service
 * (Moyasar, Tamara, ...). Keeping these in one place means stock restoration,
 * idempotent payment records, and the "paid" transition behave identically no
 * matter which provider triggered them.
 *
 * The using class MUST expose a `$checkoutService` property
 * (App\Services\CheckoutService).
 */
trait HandlesOrderFulfillment
{
    /** Expected charge amount in minor units (halalas) for verification. */
    protected function expectedMinorAmount(Order $order): int
    {
        return (int) round(((float) $order->total) * 100);
    }

    protected function configuredCurrency(string $provider): string
    {
        return strtoupper((string) config("services.{$provider}.currency", 'SAR'));
    }

    /**
     * Idempotent payment audit row, keyed on the unique gateway payment id.
     * $attrs must contain 'payment_id'.
     */
    protected function recordPaymentRow(Order $order, string $provider, array $attrs): Payment
    {
        return Payment::updateOrCreate(
            ['payment_id' => $attrs['payment_id']],
            array_merge(['order_id' => $order->id, 'provider' => $provider], $attrs)
        );
    }

    /**
     * Transition an order to paid exactly once. $extra lets a gateway stamp
     * provider-specific fields (payment_method, transaction_id, ...).
     */
    protected function markOrderPaid(Order $order, array $extra = []): void
    {
        if ($order->payment_status === 'paid') {
            return;
        }

        $order->forceFill(array_merge([
            'payment_status' => 'paid',
            'status' => $order->status === 'pending' ? 'processing' : $order->status,
            'paid_at' => now(),
        ], $extra))->save();
    }

    /**
     * Mark an order failed and return its reserved stock to inventory exactly
     * once (guarded by orders.stock_restored). Optionally cancel the order.
     */
    protected function failAndRestock(Order $order, ?string $message = null, bool $cancel = false): void
    {
        $updates = ['payment_status' => 'failed'];
        if ($cancel) {
            $updates['status'] = 'cancelled';
        }

        $order->forceFill($updates)->save();

        if (! $order->stock_restored) {
            $this->checkoutService->restoreStock($order);
            $order->forceFill(['stock_restored' => true])->save();
        }

        if ($message) {
            Log::info('Order payment failed/cancelled', [
                'order_id' => $order->id,
                'message' => $message,
            ]);
        }
    }
}
