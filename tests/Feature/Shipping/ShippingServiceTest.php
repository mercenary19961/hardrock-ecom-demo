<?php

namespace Tests\Feature\Shipping;

use App\Services\Shipping\ShippingGateway;
use App\Services\Shipping\ShippingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesOrders;
use Tests\Support\FakeShippingGateway;
use Tests\TestCase;

class ShippingServiceTest extends TestCase
{
    use RefreshDatabase;
    use CreatesOrders;

    private FakeShippingGateway $gateway;

    private ShippingService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->gateway = new FakeShippingGateway();
        $this->app->instance(ShippingGateway::class, $this->gateway);
        $this->service = $this->app->make(ShippingService::class);
    }

    public function test_fulfill_picks_cheapest_carrier_and_stores_tracking(): void
    {
        $order = $this->makeOrder(['payment_status' => 'paid']);

        $result = $this->service->fulfill($order);

        // Barq (202) is cheaper than Aramex (101).
        $this->assertEquals(202, $this->gateway->lastDeliveryOptionId);
        $this->assertEquals('Barq', $result->carrier);
        $this->assertEquals('TRK-202', $result->tracking_number);
        $this->assertEquals('oto', $result->shipping_provider);
        $this->assertEquals('shipped', $result->status);
        $this->assertNotNull($result->shipping_label_url);
        $this->assertEquals(540789, $result->oto_id);
    }

    public function test_fulfill_honours_a_chosen_delivery_option(): void
    {
        $order = $this->makeOrder(['payment_status' => 'paid']);

        $this->service->fulfill($order, 101);

        $this->assertEquals(101, $this->gateway->lastDeliveryOptionId);
        $this->assertEquals('Aramex', $order->fresh()->carrier);
    }

    public function test_fulfill_pushes_order_to_aggregator_once(): void
    {
        $order = $this->makeOrder(['payment_status' => 'paid']);

        $this->service->fulfill($order);

        $this->assertEquals(1, $this->gateway->pushOrderCalls);
        $this->assertEquals(540789, $order->fresh()->oto_id);
    }

    public function test_fulfill_refuses_to_ship_an_already_shipped_order(): void
    {
        $order = $this->makeOrder([
            'payment_status' => 'paid',
            'tracking_number' => 'EXISTING-1',
            'shipping_provider' => 'oto',
        ]);

        $this->expectException(\RuntimeException::class);
        $this->service->fulfill($order);
    }

    public function test_cancel_clears_tracking_and_reverts_status(): void
    {
        $order = $this->makeOrder([
            'payment_status' => 'paid',
            'status' => 'shipped',
            'tracking_number' => 'TRK-202',
            'carrier' => 'Barq',
            'shipping_provider' => 'oto',
            'shipping_label_url' => 'https://oto.test/label.pdf',
        ]);

        $this->service->cancel($order);

        $this->assertTrue($this->gateway->cancelCalled);
        $this->assertNull($order->fresh()->tracking_number);
        $this->assertNull($order->fresh()->carrier);
        $this->assertEquals('processing', $order->fresh()->status);
    }

    public function test_apply_status_update_maps_provider_status_to_order_status(): void
    {
        $order = $this->makeOrder(['status' => 'shipped', 'tracking_number' => 'TRK-202']);

        $this->service->applyStatusUpdate($order->order_number, 'delivered');

        $this->assertEquals('delivered', $order->fresh()->status);
    }

    public function test_apply_status_update_ignores_unknown_status(): void
    {
        $order = $this->makeOrder(['status' => 'shipped', 'tracking_number' => 'TRK-202']);

        $this->service->applyStatusUpdate($order->order_number, 'some_unknown_status');

        $this->assertEquals('shipped', $order->fresh()->status);
    }
}
