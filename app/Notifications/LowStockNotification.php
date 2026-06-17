<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Product $product) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable->wantsNotification('email', 'low_stock')) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'low_stock',
            'title'      => 'Low stock alert',
            'body'       => "{$this->product->name} is low on stock ({$this->product->stock} remaining).",
            'url'        => "/admin/products/{$this->product->id}/edit",
            'product_id' => $this->product->id,
            'stock'      => $this->product->stock,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Low Stock: {$this->product->name}")
            ->greeting('Low stock alert')
            ->line("{$this->product->name} has only {$this->product->stock} units remaining.")
            ->action('Manage Product', url("/admin/products/{$this->product->id}/edit"));
    }
}
