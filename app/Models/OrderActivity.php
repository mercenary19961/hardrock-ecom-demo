<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderActivity extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'action',
        'description',
        'old_value',
        'new_value',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a status change activity
     */
    public static function logStatusChange(Order $order, string $oldStatus, string $newStatus, ?int $userId = null): self
    {
        return self::create([
            'order_id' => $order->id,
            'user_id' => $userId,
            'action' => 'status_changed',
            'description' => "Status changed from {$oldStatus} to {$newStatus}",
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
        ]);
    }

    /**
     * Create a tracking update activity
     */
    public static function logTrackingUpdate(Order $order, ?string $trackingNumber, ?string $carrier, ?int $userId = null): self
    {
        $description = $trackingNumber
            ? "Tracking updated: {$carrier} - {$trackingNumber}"
            : "Tracking information removed";

        return self::create([
            'order_id' => $order->id,
            'user_id' => $userId,
            'action' => 'tracking_updated',
            'description' => $description,
            'old_value' => null,
            'new_value' => $trackingNumber ? "{$carrier}:{$trackingNumber}" : null,
        ]);
    }

    /**
     * Create an admin note activity
     */
    public static function logAdminNote(Order $order, string $note, ?int $userId = null): self
    {
        return self::create([
            'order_id' => $order->id,
            'user_id' => $userId,
            'action' => 'note_added',
            'description' => "Admin note added",
            'old_value' => null,
            'new_value' => $note,
        ]);
    }

    /**
     * Create an order created activity
     */
    public static function logOrderCreated(Order $order): self
    {
        return self::create([
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'action' => 'order_created',
            'description' => "Order {$order->order_number} was placed",
            'old_value' => null,
            'new_value' => null,
        ]);
    }
}
