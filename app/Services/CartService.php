<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Session;

class CartService
{
    public function getCart(?User $user = null): Cart
    {
        if ($user) {
            return $this->getUserCart($user);
        }

        return $this->getGuestCart();
    }

    protected function getUserCart(User $user): Cart
    {
        // Use firstOr to avoid unnecessary INSERT on every request
        $cart = Cart::where('user_id', $user->id)->first();

        if (!$cart) {
            $cart = Cart::create(['user_id' => $user->id]);
        }

        // Only check for guest cart merge if session has potential cart
        $sessionId = Session::getId();
        if ($sessionId) {
            $guestCart = Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->whereHas('items')  // Only fetch if it has items
                ->first();

            if ($guestCart) {
                $this->mergeCarts($guestCart, $cart);
                $guestCart->delete();
            }
        }

        return $cart->load('items.product');
    }

    protected function getGuestCart(): Cart
    {
        $sessionId = Session::getId();

        // Use first + create pattern to avoid unnecessary INSERT attempts
        $cart = Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->first();

        if (!$cart) {
            $cart = Cart::create(['session_id' => $sessionId, 'user_id' => null]);
        }

        return $cart->load('items.product');
    }

    protected function mergeCarts(Cart $source, Cart $target): void
    {
        foreach ($source->items as $item) {
            $existingItem = $target->items()->where('product_id', $item->product_id)->first();

            if ($existingItem) {
                $existingItem->update([
                    'quantity' => $existingItem->quantity + $item->quantity,
                ]);
            } else {
                $target->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                ]);
            }
        }
    }

    public function addItem(Cart $cart, Product $product, int $quantity = 1): CartItem
    {
        $existingItem = $cart->items()->where('product_id', $product->id)->first();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $quantity,
            ]);
            return $existingItem->fresh();
        }

        return $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
        ]);
    }

    public function updateQuantity(CartItem $item, int $quantity): CartItem
    {
        if ($quantity <= 0) {
            $item->delete();
            return $item;
        }

        $item->update(['quantity' => $quantity]);
        return $item->fresh();
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
    }

    public function clear(Cart $cart): void
    {
        $cart->items()->delete();
    }

    public function getCartData(Cart $cart): array
    {
        // Load images for cart items (needed for getPrimaryImageUrl fallback)
        $cart->load(['items.product.images']);

        $items = $cart->items->map(function ($item) {
            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'subtotal' => $item->subtotal,
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'name_ar' => $item->product->name_ar,
                    'slug' => $item->product->slug,
                    'price' => $item->product->price,
                    'compare_price' => $item->product->compare_price,
                    'stock' => $item->product->stock,
                    'image' => $item->product->getPrimaryImageUrl(),
                ],
            ];
        });

        return [
            'items' => $items,
            'total_items' => $cart->total_items,
            'subtotal' => $cart->subtotal,
        ];
    }
}
