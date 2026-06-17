<?php

namespace App\Services\Shipping;

use App\Models\Order;
use App\Models\OrderActivity;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates order fulfillment through a ShippingGateway (OTO). The admin
 * triggers fulfill() after payment; it pushes the order to the aggregator,
 * picks a carrier (cheapest by default, or an admin-chosen option), creates the
 * shipment, and stores the tracking number + carrier + label on the order.
 */
class ShippingService
{
    public function __construct(
        protected ShippingGateway $gateway,
    ) {}

    /**
     * Carrier options + prices for the admin to review before shipping.
     *
     * @return DeliveryOption[]
     */
    public function quote(Order $order): array
    {
        $this->ensureOrderPushed($order);

        return $this->gateway->getDeliveryOptions($order);
    }

    /**
     * Create the shipment. If $deliveryOptionId is null, the cheapest available
     * option is chosen. Idempotency: refuses to ship an order that already has a
     * tracking number.
     */
    public function fulfill(Order $order, ?int $deliveryOptionId = null, ?int $userId = null): Order
    {
        if ($order->tracking_number) {
            throw new \RuntimeException('This order already has a shipment.');
        }

        $this->ensureOrderPushed($order);

        if ($deliveryOptionId === null) {
            $deliveryOptionId = $this->cheapestOptionId($order);
        }

        $shipment = $this->gateway->createShipment($order, $deliveryOptionId);

        $order->forceFill([
            'shipping_provider' => 'oto',
            'tracking_number' => $shipment->trackingNumber,
            'carrier' => $shipment->carrier,
            'shipping_label_url' => $shipment->labelUrl,
            'oto_id' => $shipment->otoId ?? $order->oto_id,
            'status' => 'shipped',
        ])->save();

        OrderActivity::logTrackingUpdate($order, $shipment->trackingNumber, $shipment->carrier, $userId);

        return $order;
    }

    public function cancel(Order $order, ?int $userId = null): Order
    {
        if (! $order->tracking_number) {
            throw new \RuntimeException('This order has no shipment to cancel.');
        }

        $this->gateway->cancelShipment($order);

        $oldStatus = $order->status;
        $order->forceFill([
            'tracking_number' => null,
            'carrier' => null,
            'shipping_label_url' => null,
            'status' => 'processing',
        ])->save();

        OrderActivity::logStatusChange($order, $oldStatus, 'processing', $userId);

        return $order;
    }

    /**
     * Apply a shipment status update from the aggregator webhook to the order.
     * Returns the order, or null if it can't be matched.
     */
    public function applyStatusUpdate(string $orderNumber, string $providerStatus): ?Order
    {
        $order = Order::where('order_number', $orderNumber)->first();
        if (! $order) {
            Log::warning('OTO status update for unknown order', ['order_number' => $orderNumber]);

            return null;
        }

        $mapped = $this->mapStatus($providerStatus);
        if ($mapped && $order->status !== $mapped) {
            $old = $order->status;
            $order->forceFill(['status' => $mapped])->save();
            OrderActivity::logStatusChange($order, $old, $mapped, null);
        }

        return $order;
    }

    private function ensureOrderPushed(Order $order): void
    {
        if ($order->oto_id) {
            return;
        }

        $otoId = $this->gateway->pushOrder($order);
        $order->forceFill(['oto_id' => $otoId, 'shipping_provider' => 'oto'])->save();
    }

    private function cheapestOptionId(Order $order): int
    {
        $options = $this->gateway->getDeliveryOptions($order);

        if ($options === []) {
            throw new \RuntimeException('No delivery options are available for this destination.');
        }

        usort($options, fn (DeliveryOption $a, DeliveryOption $b) => $a->price <=> $b->price);

        return $options[0]->id;
    }

    private function mapStatus(string $providerStatus): ?string
    {
        return match (strtolower($providerStatus)) {
            'delivered' => 'delivered',
            'shipped', 'picked_up', 'pickedup', 'out_for_delivery', 'in_transit', 'intransit' => 'shipped',
            'cancelled', 'canceled', 'returned' => 'cancelled',
            default => null,
        };
    }
}
