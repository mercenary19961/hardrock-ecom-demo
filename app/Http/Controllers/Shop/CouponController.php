<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    protected CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * Validate and apply a coupon code
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
        ]);

        $code = strtoupper(trim($request->code));
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'success' => false,
                'error' => 'coupon_not_found',
                'message' => 'Invalid coupon code',
            ], 404);
        }

        $user = $request->user();
        $cart = $this->cartService->getCart($user);
        $cartData = $this->cartService->getCartData($cart);
        $subtotal = $cartData['subtotal'];

        // Check for validation errors
        $error = $coupon->getValidationError($user, $subtotal);
        if ($error) {
            return response()->json([
                'success' => false,
                'error' => $error,
                'message' => $this->getErrorMessage($error, $coupon),
                'min_order_amount' => $coupon->min_order_amount,
            ], 400);
        }

        // Calculate discount
        $discount = $coupon->calculateDiscount($subtotal);

        // Store coupon in session
        session(['applied_coupon' => [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'name' => $coupon->name,
            'name_ar' => $coupon->name_ar,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount' => $discount,
        ]]);

        return response()->json([
            'success' => true,
            'coupon' => [
                'code' => $coupon->code,
                'name' => $coupon->name,
                'name_ar' => $coupon->name_ar,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount' => $discount,
            ],
        ]);
    }

    /**
     * Remove applied coupon
     */
    public function remove(): JsonResponse
    {
        session()->forget('applied_coupon');

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Get list of available coupons
     */
    public function available(): JsonResponse
    {
        $coupons = Coupon::valid()
            ->select(['id', 'code', 'name', 'name_ar', 'description', 'description_ar', 'type', 'value', 'min_order_amount', 'max_discount'])
            ->orderBy('value', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'coupons' => $coupons,
        ]);
    }

    /**
     * Get currently applied coupon (if any)
     */
    public function current(): JsonResponse
    {
        $appliedCoupon = session('applied_coupon');

        if (!$appliedCoupon) {
            return response()->json([
                'success' => true,
                'coupon' => null,
            ]);
        }

        // Re-validate coupon in case cart changed
        $coupon = Coupon::find($appliedCoupon['id']);
        if (!$coupon) {
            session()->forget('applied_coupon');
            return response()->json([
                'success' => true,
                'coupon' => null,
            ]);
        }

        $user = request()->user();
        $cart = $this->cartService->getCart($user);
        $cartData = $this->cartService->getCartData($cart);
        $subtotal = $cartData['subtotal'];

        $error = $coupon->getValidationError($user, $subtotal);
        if ($error) {
            session()->forget('applied_coupon');
            return response()->json([
                'success' => true,
                'coupon' => null,
                'removed_reason' => $error,
            ]);
        }

        // Recalculate discount
        $discount = $coupon->calculateDiscount($subtotal);

        // Update session with new discount
        session(['applied_coupon' => array_merge($appliedCoupon, ['discount' => $discount])]);

        return response()->json([
            'success' => true,
            'coupon' => [
                'code' => $coupon->code,
                'name' => $coupon->name,
                'name_ar' => $coupon->name_ar,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount' => $discount,
            ],
        ]);
    }

    /**
     * Get human-readable error message
     */
    private function getErrorMessage(string $error, Coupon $coupon): string
    {
        return match ($error) {
            'coupon_inactive' => 'This coupon is no longer active',
            'coupon_not_started' => 'This coupon is not yet valid',
            'coupon_expired' => 'This coupon has expired',
            'coupon_exhausted' => 'This coupon has reached its usage limit',
            'coupon_user_limit' => 'You have already used this coupon the maximum number of times',
            'coupon_min_order' => "Minimum order of {$coupon->min_order_amount} JOD required",
            default => 'This coupon cannot be applied',
        };
    }
}
