<?php

namespace Tests\Feature\Payments;

use App\Models\Payment;
use App\Services\Payments\Tamara\TamaraClient;
use App\Services\Payments\Tamara\TamaraService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Mockery\MockInterface;
use Tests\Support\CreatesOrders;
use Tests\TestCase;

class TamaraServiceTest extends TestCase
{
    use RefreshDatabase;
    use CreatesOrders;

    private function fakeClient(\Closure $expectations): TamaraService
    {
        /** @var TamaraClient&MockInterface $mock */
        $mock = Mockery::mock(TamaraClient::class);
        $expectations($mock);
        $this->app->instance(TamaraClient::class, $mock);

        return $this->app->make(TamaraService::class);
    }

    private function tamaraOrder(array $attributes = []): \App\Models\Order
    {
        return $this->makeOrder(array_merge([
            'total' => 100,
            'payment_method' => 'tamara',
            'payment_provider' => 'tamara',
            'payment_ref' => 'tam_123',
        ], $attributes));
    }

    public function test_approved_order_is_authorised_and_marked_paid(): void
    {
        $order = $this->tamaraOrder();

        $service = $this->fakeClient(function (MockInterface $client) {
            $client->shouldReceive('getOrder')->once()->with('tam_123')->andReturn([
                'status' => 'approved',
                'total_amount' => ['amount' => 100, 'currency' => 'SAR'],
            ]);
            // Approved orders MUST be authorised to commit the funds.
            $client->shouldReceive('authorise')->once()->with('tam_123')->andReturn(['status' => 'authorised']);
        });

        $service->confirm('tam_123');

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertEquals('processing', $order->fresh()->status);
        $this->assertDatabaseHas('payments', ['payment_id' => 'tam_123', 'status' => 'paid']);
    }

    public function test_declined_order_fails_and_restocks(): void
    {
        $order = $this->tamaraOrder([], );
        $product = $order->items->first()->product;
        $stockBefore = $product->stock;

        $service = $this->fakeClient(function (MockInterface $client) {
            $client->shouldReceive('getOrder')->once()->andReturn([
                'status' => 'declined',
                'total_amount' => ['amount' => 100, 'currency' => 'SAR'],
            ]);
            $client->shouldReceive('authorise')->never();
        });

        $service->confirm('tam_123');

        $this->assertEquals('failed', $order->fresh()->payment_status);
        $this->assertTrue((bool) $order->fresh()->stock_restored);
        $this->assertEquals($stockBefore + $order->items->first()->quantity, $product->fresh()->stock);
    }

    public function test_amount_mismatch_is_not_authorised_or_paid(): void
    {
        $order = $this->tamaraOrder();

        $service = $this->fakeClient(function (MockInterface $client) {
            $client->shouldReceive('getOrder')->once()->andReturn([
                'status' => 'approved',
                'total_amount' => ['amount' => 99, 'currency' => 'SAR'], // expected 100
            ]);
            $client->shouldReceive('authorise')->never();
        });

        $service->confirm('tam_123');

        $this->assertEquals('pending', $order->fresh()->payment_status);
        $this->assertDatabaseHas('payments', ['payment_id' => 'tam_123', 'status' => 'mismatch']);
    }

    public function test_confirm_is_idempotent_once_paid(): void
    {
        $order = $this->tamaraOrder();

        $service = $this->fakeClient(function (MockInterface $client) {
            // getOrder is called each confirm, but authorise only once.
            $client->shouldReceive('getOrder')->andReturn([
                'status' => 'approved',
                'total_amount' => ['amount' => 100, 'currency' => 'SAR'],
            ]);
            $client->shouldReceive('authorise')->once();
        });

        $service->confirm('tam_123');
        $service->confirm('tam_123');

        $this->assertEquals(1, Payment::where('order_id', $order->id)->where('status', 'paid')->count());
    }

    public function test_capture_settles_an_authorised_order_at_shipment(): void
    {
        $order = $this->tamaraOrder(['payment_status' => 'paid']);
        Payment::create([
            'order_id' => $order->id,
            'provider' => 'tamara',
            'payment_id' => 'tam_123',
            'status' => 'paid',
            'amount' => 10000,
            'currency' => 'SAR',
        ]);

        $service = $this->fakeClient(function (MockInterface $client) {
            $client->shouldReceive('getOrder')->once()->with('tam_123')->andReturn(['status' => 'authorised']);
            $client->shouldReceive('capture')->once()->with('tam_123', Mockery::on(
                fn ($payload) => isset($payload['total_amount']['amount'], $payload['shipping_info']['shipped_at'])
            ))->andReturn(['status' => 'fully_captured']);
        });

        $service->capture($order, ['tracking_number' => 'TRK1', 'shipping_company' => 'Aramex']);

        $this->assertDatabaseHas('payments', ['payment_id' => 'tam_123', 'status' => 'captured']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
