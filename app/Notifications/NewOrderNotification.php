<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable->wantsNotification('email', 'new_order')) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'         => 'new_order',
            'title'        => 'New order placed',
            'body'         => "Order #{$this->order->order_number} from {$this->order->customer_name} — {$this->order->total} JOD",
            'url'          => "/admin/orders/{$this->order->id}",
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Order #{$this->order->order_number}")
            ->greeting('New order received!')
            ->line("Order #{$this->order->order_number} was placed by {$this->order->customer_name}.")
            ->line("Total: {$this->order->total} JOD")
            ->action('View Order', url("/admin/orders/{$this->order->id}"));
    }
}
