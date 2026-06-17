<?php

namespace App\Services\Payments\Tamara;

use App\Models\Order;
use App\Models\Payment;
use App\Services\CheckoutService;
use App\Services\Payments\Concerns\HandlesOrderFulfillment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates the order <-> Tamara (BNPL) lifecycle.
 *
 * Mirrors PaymentService's safety model: a webhook/redirect only TRIGGERS a
 * confirmation; the truth comes from re-fetching the Tamara order via the API
 * and verifying status + amount + currency before we mark anything paid. All
 * fulfillment funnels through confirm(), which is row-locked and idempotent.
 *
 * Money note: Tamara works in MAJOR units (100.00 SAR). Internally we still
 * record amounts in minor units in the payments table to stay consistent with
 * the Moyasar rows.
 */
class TamaraService
{
    use HandlesOrderFulfillment;

    public function __construct(
        protected TamaraClient $client,
        protected CheckoutService $checkoutService,
    ) {}

    /**
     * Create a Tamara checkout session and return the URL to redirect to.
     * Reuses an existing session while the order is still payable.
     */
    public function initiate(Order $order): string
    {
        if ($order->payment_status === 'paid') {
            throw new \RuntimeException('Order is already paid.');
        }

        if ($order->payment_url && $order->payment_ref) {
            return $order->payment_url;
        }

        $order->loadMissing('items');

        $session = $this->client->createCheckout($this->buildCheckoutPayload($order));

        $order->forceFill([
            'payment_provider' => 'tamara',
            'payment_method' => 'tamara',
            'payment_ref' => $session['order_id'],
            'payment_url' => $session['checkout_url'],
        ])->save();

        Payment::updateOrCreate(
            ['payment_id' => $session['order_id']],
            [
                'order_id' => $order->id,
                'provider' => 'tamara',
                'invoice_id' => $session['checkout_id'] ?? null,
                'status' => 'initiated',
                'amount' => $this->expectedMinorAmount($order),
                'currency' => $this->configuredCurrency('tamara'),
            ]
        );

        return $session['checkout_url'];
    }

    /**
     * Authoritative, idempotent confirmation keyed on the Tamara order id.
     * Re-fetches the order, verifies it, authorises (committing the funds) and
     * marks our order paid — or fails + restocks on decline/expiry/cancel.
     */
    public function confirm(string $tamaraOrderId): ?Order
    {
        $remote = $this->client->getOrder($tamaraOrderId);

        $order = Order::where('payment_ref', $tamaraOrderId)->first();
        if (! $order) {
            Log::warning('Tamara order could not be matched locally', ['tamara_order_id' => $tamaraOrderId]);

            return null;
        }

        return DB::transaction(function () use ($order, $remote, $tamaraOrderId) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();

            $record = Payment::where('payment_id', $tamaraOrderId)->first();
            if ($record && in_array($record->status, ['paid', 'failed'], true)) {
                return $order;
            }

            $status = (string) ($remote['status'] ?? 'new');
            $amountOk = $this->remoteMinorAmount($remote) === $this->expectedMinorAmount($order);
            $currencyOk = strtoupper((string) ($remote['total_amount']['currency'] ?? ''))
                === $this->configuredCurrency('tamara');

            // Terminal failure states.
            if (in_array($status, ['declined', 'expired', 'canceled', 'cancelled'], true)) {
                $this->recordTamaraPayment($order, $tamaraOrderId, $remote, 'failed');
                $this->failAndRestock($order, "tamara:{$status}");

                return $order;
            }

            // Approved/authorised/captured == Tamara guarantees the funds.
            $committed = in_array($status, ['authorised', 'fully_captured', 'partially_captured'], true);

            if ($status === 'approved' || $committed) {
                if (! $amountOk || ! $currencyOk) {
                    Log::error('Tamara order failed amount/currency verification', [
                        'order_id' => $order->id,
                        'tamara_order_id' => $tamaraOrderId,
                        'expected' => $this->expectedMinorAmount($order),
                        'got' => $this->remoteMinorAmount($remote),
                    ]);
                    $this->recordTamaraPayment($order, $tamaraOrderId, $remote, 'mismatch');

                    return $order;
                }

                // 'approved' must be authorised before funds are committed.
                if ($status === 'approved') {
                    $this->client->authorise($tamaraOrderId);
                }

                $this->recordTamaraPayment($order, $tamaraOrderId, $remote, 'paid');
                $this->markOrderPaid($order, [
                    'payment_method' => 'tamara',
                    'transaction_id' => $tamaraOrderId,
                ]);

                return $order;
            }

            // status 'new' / pending — nothing to do yet.
            return $order;
        });
    }

    /**
     * Re-check an order directly against Tamara (missed-webhook recovery).
     * Returns true if the order ends up paid.
     */
    public function reconcile(Order $order): bool
    {
        if (! $order->payment_ref) {
            return false;
        }

        $this->confirm($order->payment_ref);

        return $order->fresh()->payment_status === 'paid';
    }

    public function cancelAndRestock(Order $order, string $reason = 'expired'): void
    {
        DB::transaction(function () use ($order, $reason) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();
            if ($order->payment_status === 'paid') {
                return;
            }
            $this->failAndRestock($order, $reason, cancel: true);
        });
    }

    /**
     * Capture an authorised Tamara order at fulfillment time (when it ships).
     * Tamara requires real shipping_info on capture, which is why this is wired
     * to the admin tracking/shipment action rather than to approval. Safe to
     * call more than once — already-captured orders are skipped.
     */
    public function capture(Order $order, array $shippingInfo = []): void
    {
        if ($order->payment_provider !== 'tamara' || ! $order->payment_ref) {
            return;
        }

        if (Payment::where('order_id', $order->id)->where('status', 'captured')->exists()) {
            return;
        }

        $remote = $this->client->getOrder($order->payment_ref);
        $status = (string) ($remote['status'] ?? '');
        if (in_array($status, ['fully_captured'], true)) {
            return; // Already captured (e.g. auto-capture).
        }

        $this->client->capture($order->payment_ref, [
            'total_amount' => $this->money((float) $order->total),
            'shipping_info' => array_merge([
                'shipped_at' => now()->toIso8601String(),
                'shipping_company' => $order->carrier ?: 'Standard',
            ], array_filter($shippingInfo)),
        ]);

        Payment::where('payment_id', $order->payment_ref)->update(['status' => 'captured']);
    }

    private function recordTamaraPayment(Order $order, string $tamaraOrderId, array $remote, string $status): void
    {
        $this->recordPaymentRow($order, 'tamara', [
            'payment_id' => $tamaraOrderId,
            'invoice_id' => $remote['checkout_id'] ?? null,
            'status' => $status,
            'amount' => $this->remoteMinorAmount($remote),
            'currency' => $remote['total_amount']['currency'] ?? $this->configuredCurrency('tamara'),
            'source_type' => 'tamara',
            'source_company' => 'tamara',
            'failure_message' => $remote['decline_reason'] ?? null,
            'raw' => $remote,
            'paid_at' => $status === 'paid' ? now() : null,
        ]);
    }

    private function remoteMinorAmount(array $remote): int
    {
        return (int) round(((float) ($remote['total_amount']['amount'] ?? 0)) * 100);
    }

    // --- Checkout payload construction -------------------------------------

    private function buildCheckoutPayload(Order $order): array
    {
        $currency = $this->configuredCurrency('tamara');
        [$firstName, $lastName] = $this->splitName($order->customer_name);
        $address = is_array($order->shipping_address) ? $order->shipping_address : [];
        $line1 = trim(($address['building'] ?? '') . ' ' . ($address['street'] ?? '')) ?: ($address['area'] ?? 'N/A');
        $city = $address['area'] ?? 'Riyadh';

        return [
            'order_reference_id' => $order->order_number,
            'total_amount' => $this->money((float) $order->total),
            'description' => "Order {$order->order_number}",
            'country_code' => (string) config('services.tamara.country', 'SA'),
            'payment_type' => 'PAY_BY_INSTALMENTS',
            'instalments' => (int) config('services.tamara.instalments', 3),
            'locale' => app()->getLocale() === 'ar' ? 'ar_SA' : 'en_US',
            'items' => $order->items->map(fn ($item) => [
                'reference_id' => (string) ($item->product_id ?? $item->id),
                'type' => 'physical',
                'name' => $item->product_name,
                'sku' => $item->product_sku ?: ('SKU-' . ($item->product_id ?? $item->id)),
                'quantity' => $item->quantity,
                'unit_price' => $this->money((float) $item->price),
                'total_amount' => $this->money((float) $item->subtotal),
                'tax_amount' => $this->money(0),
                'discount_amount' => $this->money(0),
            ])->values()->all(),
            'consumer' => [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone_number' => $order->customer_phone ?: '500000000',
                'email' => $order->customer_email ?: ('customer+' . $order->id . '@example.com'),
            ],
            'shipping_address' => [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'line1' => $line1,
                'city' => $city,
                'country_code' => (string) config('services.tamara.country', 'SA'),
                'phone_number' => $order->customer_phone ?: '500000000',
            ],
            'tax_amount' => $this->money((float) ($order->tax ?? 0)),
            'shipping_amount' => $this->money((float) ($order->shipping_fee ?? 0)),
            'discount' => ((float) $order->discount) > 0 ? [
                'name' => $order->coupon_code ?: 'Discount',
                'amount' => $this->money((float) $order->discount),
            ] : null,
            'merchant_url' => [
                'success' => route('shop.payment.tamara.callback', ['result' => 'success']),
                'failure' => route('shop.payment.tamara.callback', ['result' => 'failure']),
                'cancel' => route('shop.payment.tamara.callback', ['result' => 'cancel']),
                'notification' => route('webhooks.tamara'),
            ],
        ];
    }

    private function money(float $amount): array
    {
        return [
            'amount' => round($amount, 2),
            'currency' => $this->configuredCurrency('tamara'),
        ];
    }

    /** @return array{0:string,1:string} */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $first = $parts[0] ?? 'Customer';
        $last = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : $first;

        return [$first, $last];
    }
}
