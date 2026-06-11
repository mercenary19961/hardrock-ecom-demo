<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\PaymentService;
use App\Services\Payments\Tamara\TamaraService;
use Illuminate\Console\Command;

/**
 * Safety net for the payment flow. For every online order still unpaid after a
 * grace window it first RE-CHECKS the gateway (in case a webhook was missed and
 * the customer actually paid) and, only if still unpaid, cancels the order and
 * returns the reserved stock to inventory.
 *
 * Scheduled every 5 minutes in routes/console.php.
 */
class ExpirePendingPayments extends Command
{
    protected $signature = 'payments:expire-pending {--minutes=30 : Grace period before an unpaid order is cancelled}';

    protected $description = 'Reconcile and expire unpaid online orders, restoring reserved stock';

    public function handle(PaymentService $paymentService, TamaraService $tamaraService): int
    {
        $minutes = (int) $this->option('minutes');
        $cutoff = now()->subMinutes($minutes);

        $orders = Order::query()
            ->whereIn('payment_provider', ['moyasar', 'tamara'])
            ->where('payment_status', 'pending')
            ->where('status', 'pending')
            ->where('created_at', '<', $cutoff)
            ->get();

        $this->info("Found {$orders->count()} unpaid order(s) older than {$minutes}m.");

        $recovered = 0;
        $cancelled = 0;

        foreach ($orders as $order) {
            // Route to the service that owns this order's gateway.
            $service = $order->payment_provider === 'tamara' ? $tamaraService : $paymentService;

            try {
                if ($service->reconcile($order)) {
                    $recovered++;
                    $this->line("  Recovered paid order {$order->order_number} via reconciliation.");
                    continue;
                }

                // Never auto-cancel an order that has a paid (or amount-mismatched)
                // payment on record — those need a human, not a restock.
                $hasSensitivePayment = Payment::where('order_id', $order->id)
                    ->whereIn('status', ['paid', 'mismatch'])
                    ->exists();

                if ($hasSensitivePayment) {
                    $this->warn("  Skipped {$order->order_number}: has paid/mismatch payment — needs manual review.");
                    continue;
                }

                $service->cancelAndRestock($order, 'payment-timeout');
                $cancelled++;
                $this->line("  Cancelled & restocked {$order->order_number}.");
            } catch (\Throwable $e) {
                $this->error("  Failed processing {$order->order_number}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Recovered: {$recovered}, Cancelled: {$cancelled}.");

        return self::SUCCESS;
    }
}
