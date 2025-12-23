<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutRequest;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\RedirectResponse;
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
        $cart = $this->cartService->getCart(auth()->user());
        $cartData = $this->cartService->getCartData($cart);

        if (empty($cartData['items'])) {
            return redirect()->route('shop.cart')->with('error', 'Your cart is empty');
        }

        // Check stock availability
        $stockErrors = $this->checkoutService->validateStock($cart);

        return Inertia::render('Shop/Checkout', [
            'cart' => $cartData,
            'stockErrors' => $stockErrors,
            'user' => auth()->user(),
        ]);
    }

    public function store(CheckoutRequest $request): RedirectResponse
    {
        $cart = $this->cartService->getCart(auth()->user());

        // Validate stock one more time
        $stockErrors = $this->checkoutService->validateStock($cart);
        if (!empty($stockErrors)) {
            return back()->withErrors(['stock' => 'Some items are no longer available in the requested quantity']);
        }

        try {
            $order = $this->checkoutService->processCheckout(
                $cart,
                $request->validated(),
                auth()->user()
            );

            return redirect()
                ->route('shop.order.confirmation', $order)
                ->with('success', 'Order placed successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['checkout' => 'Failed to process order. Please try again.']);
        }
    }
}
