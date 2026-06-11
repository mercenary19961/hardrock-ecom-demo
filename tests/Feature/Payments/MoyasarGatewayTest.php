<?php

namespace Tests\Feature\Payments;

use App\Models\Order;
use App\Services\Payments\MoyasarGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MoyasarGatewayTest extends TestCase
{
    use RefreshDatabase;

    private function gateway(): MoyasarGateway
    {
        return new MoyasarGateway(
            secretKey: 'sk_test_123',
            baseUrl: 'https://api.moyasar.com/v1',
            currency: 'SAR',
            webhookToken: 'hook-secret',
            successUrl: 'https://shop.test/payment/callback',
            callbackUrl: 'https://shop.test/webhooks/moyasar',
        );
    }

    public function test_create_invoice_sends_amount_in_halalas_with_metadata(): void
    {
        Http::fake([
            '*/invoices' => Http::response([
                'id' => 'inv_abc',
                'url' => 'https://moyasar.test/checkout/inv_abc',
                'status' => 'initiated',
            ], 201),
        ]);

        $order = Order::factory()->create(['total' => 149.50]);

        $result = $this->gateway()->createInvoice($order);

        $this->assertEquals('inv_abc', $result['invoice_id']);
        $this->assertEquals('https://moyasar.test/checkout/inv_abc', $result['url']);

        Http::assertSent(function ($request) use ($order) {
            return str_contains($request->url(), '/invoices')
                && $request['amount'] === 14950 // 149.50 SAR -> halalas
                && $request['currency'] === 'SAR'
                && $request['metadata']['order_id'] === (string) $order->id
                && str_contains($request['callback_url'], 'token=hook-secret');
        });
    }

    public function test_create_invoice_throws_on_gateway_error(): void
    {
        Http::fake(['*/invoices' => Http::response(['message' => 'bad'], 400)]);

        $order = Order::factory()->create(['total' => 50]);

        $this->expectException(\RuntimeException::class);
        $this->gateway()->createInvoice($order);
    }

    public function test_fetch_payment_normalizes_the_response(): void
    {
        Http::fake([
            '*/payments/pay_1' => Http::response([
                'id' => 'pay_1',
                'status' => 'paid',
                'amount' => 14950,
                'currency' => 'SAR',
                'invoice_id' => 'inv_abc',
                'source' => ['type' => 'creditcard', 'company' => 'mada'],
                'metadata' => ['order_id' => '42'],
            ], 200),
        ]);

        $payment = $this->gateway()->fetchPayment('pay_1');

        $this->assertEquals('pay_1', $payment->id);
        $this->assertTrue($payment->isPaid());
        $this->assertEquals(14950, $payment->amount);
        $this->assertEquals('creditcard', $payment->sourceType);
        $this->assertEquals('mada', $payment->sourceCompany);
        $this->assertEquals(42, $payment->orderId);
    }

    public function test_verify_webhook_token_is_exact_match_only(): void
    {
        $gateway = $this->gateway();

        $this->assertTrue($gateway->verifyWebhookToken('hook-secret'));
        $this->assertFalse($gateway->verifyWebhookToken('hook-secre'));
        $this->assertFalse($gateway->verifyWebhookToken(null));
        $this->assertFalse($gateway->verifyWebhookToken(''));
    }

    public function test_to_minor_units_rounds_correctly(): void
    {
        $gateway = $this->gateway();

        $this->assertEquals(10000, $gateway->toMinorUnits(100.0));
        $this->assertEquals(14950, $gateway->toMinorUnits(149.50));
        $this->assertEquals(1, $gateway->toMinorUnits(0.01));
    }
}
