<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Payments\Tamara\TamaraClient;
use App\Services\Payments\Tamara\TamaraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tamara order notifications (server-to-server).
 *
 * Security model, same spirit as the Moyasar webhook:
 *   1. Verify the HS256 `tamara-token` JWT against our notification token.
 *   2. Never trust the posted body — TamaraService re-fetches the order from
 *      Tamara and verifies amount + currency before fulfilling.
 *   3. Idempotent: duplicate deliveries resolve to the same final state.
 *
 * CSRF-exempt via the `webhooks/*` rule in bootstrap/app.php.
 */
class TamaraWebhookController extends Controller
{
    public function __construct(
        protected TamaraService $tamaraService,
        protected TamaraClient $client,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $jwt = $request->header('tamara-token');

        if (! $this->client->verifyNotificationToken($jwt)) {
            Log::warning('Rejected Tamara webhook: bad token', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $tamaraOrderId = $request->input('order_id');
        $eventType = $request->input('event_type');

        if (! $tamaraOrderId) {
            return response()->json(['message' => 'No order id'], 200);
        }

        try {
            $order = $this->tamaraService->confirm($tamaraOrderId);
        } catch (\Throwable $e) {
            Log::error('Tamara webhook processing error', [
                'tamara_order_id' => $tamaraOrderId,
                'event' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Processing error'], 500);
        }

        return response()->json([
            'message' => 'ok',
            'event' => $eventType,
            'order' => $order?->order_number,
            'status' => $order?->payment_status,
        ], 200);
    }
}
