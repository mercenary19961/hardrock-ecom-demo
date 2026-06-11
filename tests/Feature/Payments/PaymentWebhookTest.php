<?php

namespace Tests\Feature\Payments;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\Payments\NormalizedPayment;
use App\Services\Payments\PaymentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesOrders;
use Tests\Support\FakePaymentGateway;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
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

    private function cartFor(User $user, float $price = 50, int $qty = 2): Cart
    {
        $cart = Cart::create(['user_id' => $user->id]);
        $product = Product::factory()->create([
            'category_id' => Category::factory()->create()->id,
            'price' => $price,
            'stock' => 10,
        ]);
        CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => $qty]);

        return $cart;
    }

    private function checkoutData(array $overrides = []): array
    {
        return array_merge([
            'customer_name' => 'Sara Ali',
            'customer_phone' => '+966500000000',
            'delivery_area' => 'Riyadh',
        ], $overrides);
    }

    // --- Webhook authentication & fulfillment ------------------------------

    public function test_webhook_rejects_invalid_token(): void
    {
        $order = $this->makeOrder(['total' => 100]);

        $response = $this->postJson('/webhooks/moyasar?token=wrong', [
            'data' => ['id' => 'pay_x'],
        ]);

        $response->assertStatus(401);
        $this->assertEquals('pending', $order->fresh()->payment_status);
    }

    public function test_webhook_with_valid_token_marks_order_paid(): void
    {
        $order = $this->makeOrder(['total' => 100]);
        $this->gateway->withPayment(new NormalizedPayment(
            id: 'pay_ok',
            status: 'paid',
            amount: 10000,
            currency: 'SAR',
            invoiceId: 'inv_' . $order->id,
            orderId: $order->id,
        ));

        $response = $this->postJson('/webhooks/moyasar?token=test-secret', [
            'type' => 'payment_paid',
            'data' => ['id' => 'pay_ok'],
        ]);

        $response->assertOk();
        $this->assertEquals('paid', $order->fresh()->payment_status);
    }

    public function test_webhook_is_idempotent_on_repeated_delivery(): void
    {
        $order = $this->makeOrder(['total' => 100]);
        $this->gateway->withPayment(new NormalizedPayment(
            id: 'pay_ok',
            status: 'paid',
            amount: 10000,
            currency: 'SAR',
            invoiceId: 'inv_' . $order->id,
            orderId: $order->id,
        ));

        $payload = ['data' => ['id' => 'pay_ok']];
        $this->postJson('/webhooks/moyasar?token=test-secret', $payload)->assertOk();
        $this->postJson('/webhooks/moyasar?token=test-secret', $payload)->assertOk();

        $this->assertEquals(1, $order->fresh()->payments()->count());
    }

    // --- Checkout entry points ---------------------------------------------

    public function test_checkout_with_cod_places_order_without_a_gateway(): void
    {
        $user = User::factory()->create();
        $this->cartFor($user);

        $response = $this->actingAs($user)->post('/checkout', $this->checkoutData([
            'payment_method' => 'cod',
        ]));

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals(0, $this->gateway->createInvoiceCalls);
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
        ]);
    }

    public function test_checkout_with_moyasar_creates_pending_order_and_starts_payment(): void
    {
        $user = User::factory()->create();
        $this->cartFor($user, price: 50, qty: 2);

        $response = $this->actingAs($user)->post('/checkout', $this->checkoutData([
            'payment_method' => 'moyasar',
        ]));

        // Order is created pending and a gateway session was started.
        $this->assertEquals(1, $this->gateway->createInvoiceCalls);
        $order = \App\Models\Order::where('user_id', $user->id)->first();
        $this->assertNotNull($order);
        $this->assertEquals('moyasar', $order->payment_provider);
        $this->assertEquals('pending', $order->payment_status);
        $this->assertNotNull($order->payment_url);

        // Customer is handed off to the gateway (Inertia external redirect).
        $location = $response->headers->get('Location')
            ?? $response->headers->get('X-Inertia-Location');
        $this->assertNotNull($location);
        $this->assertStringContainsString('gateway.test/pay/' . $order->id, $location);
    }
}
