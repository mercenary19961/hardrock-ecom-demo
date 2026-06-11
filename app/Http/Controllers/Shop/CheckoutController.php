<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutRequest;
use App\Models\Coupon;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\Payments\PaymentService;
use App\Services\Payments\Tamara\TamaraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService,
        protected PaymentService $paymentService,
        protected TamaraService $tamaraService
    ) {}

    public function index(): Response|RedirectResponse
    {
        $cart = $this->cartService->getCart(Auth::user());
        $cartData = $this->cartService->getCartData($cart);

        if (empty($cartData['items'])) {
            return redirect()->route('shop.cart')->with('error', 'Your cart is empty');
        }

        // Check stock availability
        $stockErrors = $this->checkoutService->validateStock($cart);

        // Get applied coupon from session and validate it
        $appliedCoupon = $this->getValidatedCoupon($cartData['subtotal']);

        return Inertia::render('Shop/Checkout', [
            'cart' => $cartData,
            'stockErrors' => $stockErrors,
            'user' => Auth::user(),
            'appliedCoupon' => $appliedCoupon,
        ]);
    }

    /**
     * Get and validate applied coupon from session
     */
    private function getValidatedCoupon(float $subtotal): ?array
    {
        $sessionCoupon = session('applied_coupon');
        if (!$sessionCoupon) {
            return null;
        }

        $coupon = Coupon::find($sessionCoupon['id']);
        if (!$coupon) {
            session()->forget('applied_coupon');
            return null;
        }

        $error = $coupon->getValidationError(Auth::user(), $subtotal);
        if ($error) {
            session()->forget('applied_coupon');
            return null;
        }

        // Recalculate discount with current subtotal
        $discount = $coupon->calculateDiscount($subtotal);

        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'name' => $coupon->name,
            'name_ar' => $coupon->name_ar,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount' => $discount,
        ];
    }

    public function store(CheckoutRequest $request): RedirectResponse|HttpResponse
    {
        $cart = $this->cartService->getCart(Auth::user());

        // Validate stock one more time
        $stockErrors = $this->checkoutService->validateStock($cart);
        if (!empty($stockErrors)) {
            return back()->withErrors(['stock' => 'Some items are no longer available in the requested quantity']);
        }

        // 'moyasar' / 'tamara' = pay online now; 'cod' = cash on delivery.
        // Default to 'cod' so a bare POST never triggers a gateway call — the
        // online buttons always send their method explicitly.
        $paymentMethod = $request->input('payment_method', 'cod');
        $onlineMethods = ['moyasar', 'tamara'];

        try {
            $order = $this->checkoutService->processCheckout(
                $cart,
                $request->validated(),
                Auth::user(),
                $paymentMethod
            );
        } catch (\Exception $e) {
            Log::error('Checkout failed', ['error' => $e->getMessage(), 'user_id' => Auth::id()]);

            return back()->withErrors(['checkout' => 'Failed to process order. Please try again.']);
        }

        // Cash on delivery: the order is placed, no payment to collect now.
        if (! in_array($paymentMethod, $onlineMethods, true)) {
            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('success', 'Order placed successfully!');
        }

        // Online payment: hand the customer off to the hosted gateway. The order
        // already exists (pending/unpaid); if initiation fails it will be
        // auto-cancelled and restocked by the expiry sweeper.
        try {
            $url = $paymentMethod === 'tamara'
                ? $this->tamaraService->initiate($order)
                : $this->paymentService->initiate($order);

            return Inertia::location($url);
        } catch (\Throwable $e) {
            Log::error('Payment initiation failed at checkout', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('error', 'Your order was created but we could not start the payment. You can retry payment from the order page.');
        }
    }

    /**
     * Process WhatsApp checkout - creates order and returns order number
     */
    public function whatsappOrder(Request $request): JsonResponse
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'delivery_area' => 'required|string|max:255',
        ]);

        $cart = $this->cartService->getCart(Auth::user());

        // Validate stock
        $stockErrors = $this->checkoutService->validateStock($cart);
        if (!empty($stockErrors)) {
            return response()->json([
                'success' => false,
                'message' => 'Some items are no longer available in the requested quantity',
            ], 422);
        }

        try {
            $order = $this->checkoutService->processWhatsAppCheckout(
                $cart,
                $request->only(['customer_name', 'customer_phone', 'delivery_area']),
                Auth::user()
            );

            return response()->json([
                'success' => true,
                'order_number' => $order->order_number,
                'order_id' => $order->id,
            ]);
        } catch (\Exception $e) {
            Log::error('WhatsApp checkout error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process order. Please try again.',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
