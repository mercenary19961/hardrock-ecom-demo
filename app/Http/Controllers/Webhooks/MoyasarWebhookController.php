<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Authoritative server-to-server payment notification endpoint.
 *
 * Security model (defense in depth):
 *   1. Shared secret token, accepted on the URL (?token=) or in the body
 *      (secret_token) — Moyasar supports both depending on configuration.
 *      Compared in constant time.
 *   2. We never trust the posted amount/status. The token only proves the
 *      caller knows our secret; PaymentService then RE-FETCHES the payment
 *      from Moyasar's API and verifies amount + currency before fulfilling.
 *   3. Idempotent: duplicate deliveries resolve to the same final state.
 *
 * This route is CSRF-exempt (configured in bootstrap/app.php).
 */
class MoyasarWebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected PaymentGateway $gateway,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $token = $request->query('token') ?? $request->input('secret_token');

        if (! $this->gateway->verifyWebhookToken($token)) {
            Log::warning('Rejected Moyasar webhook: bad token', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Moyasar nests the payment under `data` for webhooks, but the invoice
        // callback_url notification may post the object/ids at the top level.
        $paymentId = $request->input('data.id')
            ?? $request->input('id')
            ?? $request->input('data.payments.0.id');

        if (! $paymentId) {
            Log::warning('Moyasar webhook had no resolvable payment id', [
                'type' => $request->input('type'),
                'keys' => array_keys($request->all()),
            ]);

            // 200 so Moyasar stops retrying a payload we can't act on.
            return response()->json(['message' => 'No payment id'], 200);
        }

        try {
            $order = $this->paymentService->confirmFromGateway($paymentId);
        } catch (\Throwable $e) {
            Log::error('Moyasar webhook processing error', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            // 500 => Moyasar will retry, which is what we want for a transient
            // failure (e.g. their API briefly unreachable during re-fetch).
            return response()->json(['message' => 'Processing error'], 500);
        }

        return response()->json([
            'message' => 'ok',
            'order' => $order?->order_number,
            'status' => $order?->payment_status,
        ], 200);
    }
}
