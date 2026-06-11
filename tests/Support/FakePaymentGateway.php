<?php

namespace Tests\Support;

use App\Models\Order;
use App\Services\Payments\NormalizedPayment;
use App\Services\Payments\PaymentGateway;
use RuntimeException;

/**
 * In-memory PaymentGateway test double. Lets payment tests drive the exact
 * gateway responses (paid / failed / wrong amount / missing) without any HTTP,
 * so we can assert PaymentService's verification + idempotency behaviour.
 */
class FakePaymentGateway implements PaymentGateway
{
    /** @var array<string, NormalizedPayment> keyed by payment id */
    public array $paymentsById = [];

    public string $webhookToken = 'test-secret';

    public int $createInvoiceCalls = 0;

    public function withPayment(NormalizedPayment $payment): self
    {
        $this->paymentsById[$payment->id] = $payment;

        return $this;
    }

    public function createInvoice(Order $order): array
    {
        $this->createInvoiceCalls++;

        return [
            'url' => 'https://gateway.test/pay/' . $order->id,
            'invoice_id' => 'inv_' . $order->id,
            'raw' => ['id' => 'inv_' . $order->id],
        ];
    }

    public function fetchPayment(string $paymentId): NormalizedPayment
    {
        if (! isset($this->paymentsById[$paymentId])) {
            throw new RuntimeException("Fake payment {$paymentId} not configured.");
        }

        return $this->paymentsById[$paymentId];
    }

    public function fetchInvoice(string $invoiceId): array
    {
        $payments = array_values(array_filter(
            $this->paymentsById,
            fn (NormalizedPayment $p) => $p->invoiceId === $invoiceId
        ));

        return [
            'status' => $payments === [] ? 'initiated' : $payments[0]->status,
            'payments' => $payments,
            'raw' => [],
        ];
    }

    public function verifyWebhookToken(?string $token): bool
    {
        return $token !== null && hash_equals($this->webhookToken, $token);
    }
}
