<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\EditorSensitiveActionNotification;
use App\Notifications\LowStockNotification;
use App\Notifications\NewOrderNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /** Notify all staff (admins + editors) that a new order was placed. */
    public function notifyNewOrder(Order $order): void
    {
        $staff = User::whereIn('role', ['admin', 'editor'])->get();
        Notification::send($staff, new NewOrderNotification($order));
    }

    /**
     * Notify all admins that an editor performed a sensitive action.
     * Only fires when the current user is an editor.
     */
    public function notifyEditorAction(string $action, string $subject, ?string $url = null): void
    {
        $user = Auth::user();
        if (! $user || ! $user->isEditor()) {
            return;
        }

        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new EditorSensitiveActionNotification(
            editorName: $user->name,
            action: $action,
            subject: $subject,
            url: $url,
        ));
    }

    /** Notify all staff that a product has hit low stock. */
    public function notifyLowStock(Product $product): void
    {
        $staff = User::whereIn('role', ['admin', 'editor'])->get();
        Notification::send($staff, new LowStockNotification($product));
    }

    /** Fire a low-stock alert if the product just crossed the threshold. */
    public function checkAndNotifyLowStock(Product $product, int $previousStock): void
    {
        $threshold = $product->low_stock_threshold ?? 5;

        if ($previousStock > $threshold && $product->stock <= $threshold && $product->stock > 0) {
            $this->notifyLowStock($product);
        }
    }
}
