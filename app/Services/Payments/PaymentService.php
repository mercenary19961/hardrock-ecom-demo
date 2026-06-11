<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Services\CheckoutService;
use App\Services\Payments\Concerns\HandlesOrderFulfillment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates the order <-> Moyasar (card/mada/Apple Pay/STC Pay) lifecycle.
 *
 * The golden rule lives here: an order is only ever marked paid after we
 * RE-FETCH the payment from the gateway and confirm status + amount + currency
 * ourselves. The browser redirect and the webhook body are treated as untrusted
 * triggers, never as proof of payment. Every fulfillment path funnels through
 * confirmFromGateway(), which is idempotent and row-locked so duplicate
 * webhooks, the success redirect, and the reconciliation sweeper can all fire
 * for the same order without double-charging, double-fulfilling, or
 * double-restoring stock.
 */
class PaymentService
{
    use HandlesOrderFulfillment;

    public function __construct(
        protected PaymentGateway $gateway,
        protected CheckoutService $checkoutService,
    ) {}

    /**
     * Create a hosted payment session and return the URL to redirect the
     * customer to. Safe to call again if the customer abandoned and retried:
     * we reuse the existing invoice URL while the order is still payable.
     */
    public function initiate(Order $order): string
    {
        if ($order->payment_status === 'paid') {
            throw new \RuntimeException('Order is already paid.');
        }

        if ($order->payment_url && $order->payment_ref) {
            return $order->payment_url;
        }

        $invoice = $this->gateway->createInvoice($order);

        $order->forceFill([
            'payment_provider' => 'moyasar',
            'payment_ref' => $invoice['invoice_id'],
            'payment_url' => $invoice['url'],
        ])->save();

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar',
            'invoice_id' => $invoice['invoice_id'],
            'status' => 'initiated',
            'amount' => $this->expectedMinorAmount($order),
            'currency' => $this->configuredCurrency('moyasar'),
        ]);

        return $invoice['url'];
    }

    /**
     * Authoritative, idempotent confirmation. Given a gateway payment id, it
     * re-fetches the payment, verifies it against the order, and transitions
     * the order exactly once. Returns the resolved Order (or null if the
     * payment can't be matched to one).
     */
    public function confirmFromGateway(string $paymentId): ?Order
    {
        $payment = $this->gateway->fetchPayment($paymentId);

        $order = $this->resolveOrder($payment);
        if (! $order) {
            Log::warning('Payment could not be matched to an order', [
                'payment_id' => $payment->id,
                'invoice_id' => $payment->invoiceId,
                'order_id_meta' => $payment->orderId,
            ]);

            return null;
        }

        return DB::transaction(function () use ($order, $payment) {
            // Lock the order row for the duration so concurrent webhook +
            // redirect + sweeper calls serialize instead of racing.
            $order = Order::whereKey($order->id)->lockForUpdate()->first();

            // Idempotency anchor: unique payment_id. If we've already recorded
            // this exact gateway payment in a final state, nothing more to do.
            $record = Payment::where('payment_id', $payment->id)->first();
            if ($record && in_array($record->status, ['paid', 'failed'], true)) {
                return $order;
            }

            $expected = $this->expectedMinorAmount($order);
            $amountOk = $payment->amount === $expected;
            $currencyOk = strtoupper($payment->currency) === $this->configuredCurrency('moyasar');

            // Amount/currency mismatch on an otherwise "paid" payment is a red
            // flag (tampering or wrong invoice) — never fulfill it.
            if ($payment->isPaid() && $amountOk && $currencyOk) {
                $this->recordPaymentRow($order, 'moyasar', $this->paymentAttributes($payment, 'paid'));
                $this->markOrderPaid($order, [
                    'payment_method' => $payment->sourceType ?? 'moyasar',
                    'transaction_id' => $payment->id,
                ]);

                return $order;
            }

            if ($payment->isPaid() && (! $amountOk || ! $currencyOk)) {
                Log::error('Paid Moyasar payment failed verification', [
                    'order_id' => $order->id,
                    'payment_id' => $payment->id,
                    'expected_amount' => $expected,
                    'got_amount' => $payment->amount,
                    'expected_currency' => $this->configuredCurrency('moyasar'),
                    'got_currency' => $payment->currency,
                ]);
                // Treat as unfulfilled; leave order pending for manual review.
                $this->recordPaymentRow($order, 'moyasar', $this->paymentAttributes($payment, 'mismatch'));

                return $order;
            }

            if ($payment->isFailed()) {
                $this->recordPaymentRow($order, 'moyasar', $this->paymentAttributes($payment, 'failed'));
                $this->failAndRestock($order, $payment->failureMessage);
            }

            return $order;
        });
    }

    /**
     * Cancel an unpaid order and return its reserved stock to inventory.
     * Idempotent via the stock_restored guard.
     */
    public function cancelAndRestock(Order $order, string $reason = 'expired'): void
    {
        DB::transaction(function () use ($order, $reason) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();

            if ($order->payment_status === 'paid') {
                return; // Never restock a paid order.
            }

            $this->failAndRestock($order, $reason, cancel: true);
        });
    }

    /**
     * Re-check an order against the gateway. Recovers orders whose webhook was
     * missed (network blip, downtime). Returns true if the order is now paid.
     */
    public function reconcile(Order $order): bool
    {
        if (! $order->payment_ref) {
            return false;
        }

        $invoice = $this->gateway->fetchInvoice($order->payment_ref);

        foreach ($invoice['payments'] as $payment) {
            if ($payment->isPaid()) {
                $this->confirmFromGateway($payment->id);

                return $order->fresh()->payment_status === 'paid';
            }
        }

        return false;
    }

    private function paymentAttributes(NormalizedPayment $payment, string $status): array
    {
        return [
            'payment_id' => $payment->id,
            'invoice_id' => $payment->invoiceId,
            'status' => $status,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'source_type' => $payment->sourceType,
            'source_company' => $payment->sourceCompany,
            'failure_message' => $payment->failureMessage,
            'raw' => $payment->raw,
            'paid_at' => $status === 'paid' ? now() : null,
        ];
    }

    private function resolveOrder(NormalizedPayment $payment): ?Order
    {
        if ($payment->orderId) {
            $order = Order::find($payment->orderId);
            if ($order) {
                return $order;
            }
        }

        if ($payment->invoiceId) {
            return Order::where('payment_ref', $payment->invoiceId)->first();
        }

        return null;
    }
}
