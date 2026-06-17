<?php

namespace Tests\Feature\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\Payments\NormalizedPayment;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesOrders;
use Tests\Support\FakePaymentGateway;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;
    use CreatesOrders;

    private FakePaymentGateway $gateway;

    private PaymentService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->gateway = new FakePaymentGateway();
        $this->app->instance(PaymentGateway::class, $this->gateway);
        $this->service = $this->app->make(PaymentService::class);
    }

    private function paidPayment(Order $order, array $overrides = []): NormalizedPayment
    {
        return new NormalizedPayment(
            id: $overrides['id'] ?? 'pay_123',
            status: $overrides['status'] ?? 'paid',
            amount: $overrides['amount'] ?? (int) round(((float) $order->total) * 100),
            currency: $overrides['currency'] ?? 'SAR',
            sourceType: 'creditcard',
            sourceCompany: 'mada',
            invoiceId: $overrides['invoiceId'] ?? 'inv_' . $order->id,
            orderId: $overrides['orderId'] ?? $order->id,
        );
    }

    public function test_confirm_marks_order_paid_when_amount_and_currency_match(): void
    {
        $order = $this->makeOrder(['total' => 100]);
        $this->gateway->withPayment($this->paidPayment($order));

        $result = $this->service->confirmFromGateway('pay_123');

        $this->assertEquals('paid', $result->payment_status);
        $this->assertEquals('processing', $result->status);
        $this->assertNotNull($result->fresh()->paid_at);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'payment_id' => 'pay_123',
            'status' => 'paid',
        ]);
    }

    public function test_confirm_is_idempotent_for_duplicate_webhooks(): void
    {
        $order = $this->makeOrder(['total' => 100]);
        $this->gateway->withPayment($this->paidPayment($order));

        $this->service->confirmFromGateway('pay_123');
        $paidAt = $order->fresh()->paid_at;

        // Simulate a duplicate webhook delivery.
        $this->service->confirmFromGateway('pay_123');

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertEquals(1, Payment::where('order_id', $order->id)->count());
        $this->assertEquals(
            $paidAt->toIso8601String(),
            $order->fresh()->paid_at->toIso8601String(),
            'paid_at must not change on duplicate confirmation'
        );
    }

    public function test_confirm_does_not_fulfill_on_amount_mismatch(): void
    {
        $order = $this->makeOrder(['total' => 100]);
        // Gateway reports a different amount than the order total (tampering).
        $this->gateway->withPayment($this->paidPayment($order, ['amount' => 9999]));

        $this->service->confirmFromGateway('pay_123');

        $this->assertEquals('pending', $order->fresh()->payment_status);
        $this->assertDatabaseHas('payments', [
            'payment_id' => 'pay_123',
            'status' => 'mismatch',
        ]);
    }

    public function test_confirm_does_not_fulfill_on_currency_mismatch(): void
    {
        $order = $this->makeOrder(['total' => 100]);
        $this->gateway->withPayment($this->paidPayment($order, ['currency' => 'USD']));

        $this->service->confirmFromGateway('pay_123');

        $this->assertEquals('pending', $order->fresh()->payment_status);
        $this->assertDatabaseHas('payments', ['payment_id' => 'pay_123', 'status' => 'mismatch']);
    }

    public function test_failed_payment_restores_stock_exactly_once(): void
    {
        $order = $this->makeOrder(
            ['total' => 100],
            [['price' => 50, 'quantity' => 2, 'stock_after' => 8]]
        );
        $product = $order->items->first()->product;

        $this->gateway->withPayment($this->paidPayment($order, ['status' => 'failed']));

        $this->service->confirmFromGateway('pay_123');

        $this->assertEquals('failed', $order->fresh()->payment_status);
        $this->assertTrue((bool) $order->fresh()->stock_restored);
        $this->assertEquals(10, $product->fresh()->stock, 'stock should be returned (8 + 2)');

        // Duplicate failed webhook must not double-restock.
        $this->service->confirmFromGateway('pay_123');
        $this->assertEquals(10, $product->fresh()->stock);
    }

    public function test_cancel_and_restock_is_guarded_against_double_restore(): void
    {
        $order = $this->makeOrder(
            ['total' => 100],
            [['price' => 50, 'quantity' => 2, 'stock_after' => 8]]
        );
        $product = $order->items->first()->product;

        $this->service->cancelAndRestock($order, 'timeout');
        $this->service->cancelAndRestock($order->fresh(), 'timeout');

        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals('failed', $order->fresh()->payment_status);
        $this->assertEquals(10, $product->fresh()->stock, 'restock must happen only once');
    }

    public function test_cancel_and_restock_never_touches_a_paid_order(): void
    {
        $order = $this->makeOrder(
            ['total' => 100, 'payment_status' => 'paid'],
            [['price' => 50, 'quantity' => 2, 'stock_after' => 8]]
        );
        $product = $order->items->first()->product;

        $this->service->cancelAndRestock($order, 'timeout');

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertEquals(8, $product->fresh()->stock, 'a paid order must never be restocked');
    }

    public function test_reconcile_recovers_a_paid_order_from_a_missed_webhook(): void
    {
        $order = $this->makeOrder(['total' => 100, 'payment_ref' => 'inv_recover']);
        $this->gateway->withPayment($this->paidPayment($order, [
            'id' => 'pay_recover',
            'invoiceId' => 'inv_recover',
        ]));

        $recovered = $this->service->reconcile($order);

        $this->assertTrue($recovered);
        $this->assertEquals('paid', $order->fresh()->payment_status);
    }

    public function test_initiate_persists_gateway_reference_and_payment_url(): void
    {
        $order = $this->makeOrder(['total' => 100, 'payment_ref' => null, 'payment_url' => null]);

        $url = $this->service->initiate($order);

        $this->assertStringContainsString('gateway.test/pay', $url);
        $this->assertEquals('inv_' . $order->id, $order->fresh()->payment_ref);
        $this->assertEquals('moyasar', $order->fresh()->payment_provider);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'initiated',
        ]);
    }

    public function test_initiate_reuses_existing_session_instead_of_creating_a_new_one(): void
    {
        $order = $this->makeOrder([
            'total' => 100,
            'payment_ref' => 'inv_existing',
            'payment_url' => 'https://gateway.test/pay/existing',
        ]);

        $url = $this->service->initiate($order);

        $this->assertEquals('https://gateway.test/pay/existing', $url);
        $this->assertEquals(0, $this->gateway->createInvoiceCalls);
    }
}
