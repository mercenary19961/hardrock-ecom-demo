<?php

namespace Tests\Feature\Payments;

use App\Models\Payment;
use App\Services\Payments\NormalizedPayment;
use App\Services\Payments\PaymentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesOrders;
use Tests\Support\FakePaymentGateway;
use Tests\TestCase;

class ExpirePendingPaymentsTest extends TestCase
{
    use RefreshDatabase;
    use CreatesOrders;

    private FakePaymentGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();

        $this->gateway = new FakePaymentGateway();
        $this->app->instance(PaymentGateway::class, $this->gateway);
    }

    public function test_expires_stale_unpaid_order_and_restocks(): void
    {
        $order = $this->makeOrder([
            'total' => 100,
            'payment_ref' => 'inv_stale',
            'created_at' => now()->subHour(),
        ], [['price' => 50, 'quantity' => 2, 'stock_after' => 8]]);
        $product = $order->items->first()->product;

        $this->artisan('payments:expire-pending', ['--minutes' => 30])->assertSuccessful();

        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals('failed', $order->fresh()->payment_status);
        $this->assertEquals(10, $product->fresh()->stock);
    }

    public function test_does_not_touch_recent_orders(): void
    {
        $order = $this->makeOrder([
            'total' => 100,
            'payment_ref' => 'inv_recent',
            'created_at' => now()->subMinutes(5),
        ]);

        $this->artisan('payments:expire-pending', ['--minutes' => 30])->assertSuccessful();

        $this->assertEquals('pending', $order->fresh()->status);
        $this->assertEquals('pending', $order->fresh()->payment_status);
    }

    public function test_skips_order_with_mismatch_payment_for_manual_review(): void
    {
        $order = $this->makeOrder([
            'total' => 100,
            'payment_ref' => 'inv_mismatch',
            'created_at' => now()->subHour(),
        ], [['price' => 50, 'quantity' => 2, 'stock_after' => 8]]);
        $product = $order->items->first()->product;

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar',
            'payment_id' => 'pay_mismatch',
            'status' => 'mismatch',
            'amount' => 9999,
            'currency' => 'SAR',
        ]);

        $this->artisan('payments:expire-pending', ['--minutes' => 30])->assertSuccessful();

        // Must NOT be cancelled/restocked — a human needs to look at it.
        $this->assertEquals('pending', $order->fresh()->status);
        $this->assertEquals(8, $product->fresh()->stock);
    }

    public function test_recovers_a_paid_order_via_reconciliation(): void
    {
        $order = $this->makeOrder([
            'total' => 100,
            'payment_ref' => 'inv_rec',
            'created_at' => now()->subHour(),
        ]);

        // A payment actually succeeded but the webhook was missed.
        $this->gateway->withPayment(new NormalizedPayment(
            id: 'pay_rec',
            status: 'paid',
            amount: 10000,
            currency: 'SAR',
            invoiceId: 'inv_rec',
            orderId: $order->id,
        ));

        $this->artisan('payments:expire-pending', ['--minutes' => 30])->assertSuccessful();

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertNotEquals('cancelled', $order->fresh()->status);
    }
}
