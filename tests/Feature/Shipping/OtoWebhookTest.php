<?php

namespace Tests\Feature\Shipping;

use App\Services\Shipping\ShippingGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesOrders;
use Tests\Support\FakeShippingGateway;
use Tests\TestCase;

class OtoWebhookTest extends TestCase
{
    use RefreshDatabase;
    use CreatesOrders;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->instance(ShippingGateway::class, new FakeShippingGateway());
    }

    public function test_rejects_invalid_token(): void
    {
        $order = $this->makeOrder(['status' => 'shipped', 'tracking_number' => 'TRK-1']);

        $response = $this->postJson('/webhooks/oto?token=wrong', [
            'orderId' => $order->order_number,
            'status' => 'delivered',
        ]);

        $response->assertStatus(401);
        $this->assertEquals('shipped', $order->fresh()->status);
    }

    public function test_valid_token_updates_order_status(): void
    {
        $order = $this->makeOrder(['status' => 'shipped', 'tracking_number' => 'TRK-1']);

        $response = $this->postJson('/webhooks/oto?token=ship-secret', [
            'orderId' => $order->order_number,
            'status' => 'delivered',
        ]);

        $response->assertOk();
        $this->assertEquals('delivered', $order->fresh()->status);
    }

    public function test_unknown_order_is_handled_gracefully(): void
    {
        $response = $this->postJson('/webhooks/oto?token=ship-secret', [
            'orderId' => 'HR-DOES-NOT-EXIST',
            'status' => 'delivered',
        ]);

        $response->assertOk();
    }
}
