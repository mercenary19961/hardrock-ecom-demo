<?php

namespace Tests\Support;

use App\Models\Order;
use App\Services\Shipping\DeliveryOption;
use App\Services\Shipping\NormalizedShipment;
use App\Services\Shipping\ShippingGateway;

/**
 * In-memory ShippingGateway double so shipping tests can drive carrier options
 * and shipment results without hitting the OTO API.
 */
class FakeShippingGateway implements ShippingGateway
{
    /** @var DeliveryOption[] */
    public array $options = [];

    public string $webhookToken = 'ship-secret';

    public int $pushOrderCalls = 0;

    public ?int $lastDeliveryOptionId = null;

    public bool $cancelCalled = false;

    public function __construct()
    {
        // Default: two carriers, Barq cheaper than Aramex.
        $this->options = [
            new DeliveryOption(id: 101, carrier: 'Aramex', price: 22.0, estimatedDelivery: '1 to 2 Working Days'),
            new DeliveryOption(id: 202, carrier: 'Barq', price: 15.0, estimatedDelivery: '2 to 3 Working Days'),
        ];
    }

    public function pushOrder(Order $order): int
    {
        $this->pushOrderCalls++;

        return 540789;
    }

    public function getDeliveryOptions(Order $order): array
    {
        return $this->options;
    }

    public function createShipment(Order $order, int $deliveryOptionId): NormalizedShipment
    {
        $this->lastDeliveryOptionId = $deliveryOptionId;

        $carrier = collect($this->options)->firstWhere('id', $deliveryOptionId)?->carrier ?? 'OTO';

        return new NormalizedShipment(
            trackingNumber: 'TRK-' . $deliveryOptionId,
            carrier: $carrier,
            labelUrl: 'https://oto.test/label/' . $order->order_number . '.pdf',
            otoId: 540789,
        );
    }

    public function cancelShipment(Order $order): bool
    {
        $this->cancelCalled = true;

        return true;
    }

    public function verifyWebhookToken(?string $token): bool
    {
        return $token !== null && hash_equals($this->webhookToken, $token);
    }
}
