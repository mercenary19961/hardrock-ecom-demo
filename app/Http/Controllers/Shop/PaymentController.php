<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Payments\PaymentService;
use App\Services\Payments\Tamara\TamaraService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected TamaraService $tamaraService,
    ) {}

    /**
     * Start (or resume) the hosted payment for an order and hand the customer
     * off to the right gateway. Inertia::location triggers a full-page redirect
     * to the external checkout.
     */
    public function pay(Order $order)
    {
        $this->authorizeOrder($order);

        if ($order->payment_status === 'paid') {
            return redirect()->route('shop.order.confirmation', $order);
        }

        try {
            $url = $order->payment_method === 'tamara'
                ? $this->tamaraService->initiate($order)
                : $this->paymentService->initiate($order);
        } catch (\Throwable $e) {
            Log::error('Failed to initiate payment', [
                'order_id' => $order->id,
                'provider' => $order->payment_method,
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->route('shop.checkout')
                ->with('error', 'We could not start the payment. Please try again.');
        }

        return Inertia::location($url);
    }

    /**
     * Where Moyasar sends the customer's BROWSER back (success_url). This is a
     * UX convenience only — fulfillment is owned by the webhook. We still
     * confirm here so a customer who returns before the webhook lands sees the
     * right result immediately (the confirm is idempotent).
     */
    public function callback(Request $request): RedirectResponse
    {
        $paymentId = $request->query('id');
        $invoiceId = $request->query('invoice_id');

        $order = null;

        try {
            if ($paymentId) {
                $order = $this->paymentService->confirmFromGateway($paymentId);
            } elseif ($invoiceId) {
                $order = Order::where('payment_ref', $invoiceId)->first();
                if ($order) {
                    $this->paymentService->reconcile($order);
                    $order = $order->fresh();
                }
            }
        } catch (\Throwable $e) {
            Log::error('Payment callback processing failed', [
                'payment_id' => $paymentId,
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
            ]);
        }

        if ($order && $order->payment_status === 'paid') {
            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('success', 'Payment received — thank you!');
        }

        // Not paid (failed/cancelled/back button). Send them somewhere useful.
        if ($order) {
            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('error', 'Your payment was not completed. You can try paying again.');
        }

        return redirect()
            ->route('shop.cart')
            ->with('error', 'We could not confirm your payment. If you were charged, contact support.');
    }

    /**
     * Tamara redirects the customer's browser here (success/failure/cancel).
     * UX only — fulfillment is owned by the Tamara webhook. We reconcile here
     * (idempotently) so a customer returning before the webhook lands still
     * sees the right result.
     */
    public function tamaraCallback(Request $request): RedirectResponse
    {
        $result = $request->query('result', 'success');
        $tamaraOrderId = $request->query('orderId') ?? $request->query('order_id');

        $order = null;

        try {
            if ($tamaraOrderId) {
                $order = $this->tamaraService->confirm($tamaraOrderId);
            }
        } catch (\Throwable $e) {
            Log::error('Tamara callback processing failed', [
                'tamara_order_id' => $tamaraOrderId,
                'error' => $e->getMessage(),
            ]);
        }

        if ($order && $order->payment_status === 'paid') {
            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('success', 'Payment received — thank you!');
        }

        if ($order) {
            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('error', $result === 'cancel'
                    ? 'You cancelled the Tamara payment. You can try again.'
                    : 'Your Tamara payment was not completed. You can try paying again.');
        }

        return redirect()
            ->route('shop.cart')
            ->with('error', 'We could not confirm your payment. If you were charged, contact support.');
    }

    private function authorizeOrder(Order $order): void
    {
        // Orders may be guest (user_id null) created in this session, or belong
        // to the authenticated user. Block cross-user access.
        if ($order->user_id !== null && $order->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
