<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutRequest;
use App\Models\Coupon;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService
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

    public function store(CheckoutRequest $request): RedirectResponse
    {
        $cart = $this->cartService->getCart(Auth::user());

        // Validate stock one more time
        $stockErrors = $this->checkoutService->validateStock($cart);
        if (!empty($stockErrors)) {
            return back()->withErrors(['stock' => 'Some items are no longer available in the requested quantity']);
        }

        try {
            $order = $this->checkoutService->processCheckout(
                $cart,
                $request->validated(),
                Auth::user()
            );

            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('success', 'Order placed successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['checkout' => 'Failed to process order. Please try again.']);
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to process order. Please try again.',
            ], 500);
        }
    }
}
