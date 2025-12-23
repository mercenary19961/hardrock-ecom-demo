<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function index(): Response
    {
        $cart = $this->cartService->getCart(auth()->user());
        $cartData = $this->cartService->getCartData($cart);

        return Inertia::render('Shop/Cart', [
            'cart' => $cartData,
        ]);
    }

    public function add(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'integer|min:1|max:99',
        ]);

        $product = Product::findOrFail($request->product_id);

        if (!$product->is_active || !$product->isInStock()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Product is not available'], 422);
            }
            return back()->with('error', 'Product is not available');
        }

        $cart = $this->cartService->getCart(auth()->user());
        $this->cartService->addItem($cart, $product, $request->get('quantity', 1));

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Product added to cart',
                'cart' => $this->cartService->getCartData($cart->fresh()),
            ]);
        }

        return back()->with('success', 'Product added to cart');
    }

    public function update(Request $request, CartItem $item): RedirectResponse|JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:0|max:99',
        ]);

        $cart = $this->cartService->getCart(auth()->user());

        // Verify item belongs to this cart
        if ($item->cart_id !== $cart->id) {
            abort(403);
        }

        $this->cartService->updateQuantity($item, $request->quantity);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Cart updated',
                'cart' => $this->cartService->getCartData($cart->fresh()),
            ]);
        }

        return back()->with('success', 'Cart updated');
    }

    public function remove(Request $request, CartItem $item): RedirectResponse|JsonResponse
    {
        $cart = $this->cartService->getCart(auth()->user());

        // Verify item belongs to this cart
        if ($item->cart_id !== $cart->id) {
            abort(403);
        }

        $this->cartService->removeItem($item);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Item removed',
                'cart' => $this->cartService->getCartData($cart->fresh()),
            ]);
        }

        return back()->with('success', 'Item removed from cart');
    }

    public function data(): JsonResponse
    {
        $cart = $this->cartService->getCart(auth()->user());
        return response()->json($this->cartService->getCartData($cart));
    }
}
