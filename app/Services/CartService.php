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
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // Merge guest cart if exists
        $sessionId = Session::getId();
        $guestCart = Cart::where('session_id', $sessionId)->whereNull('user_id')->first();

        if ($guestCart && $guestCart->items->isNotEmpty()) {
            $this->mergeCarts($guestCart, $cart);
            $guestCart->delete();
        }

        return $cart->load('items.product');
    }

    protected function getGuestCart(): Cart
    {
        $sessionId = Session::getId();

        return Cart::firstOrCreate(
            ['session_id' => $sessionId, 'user_id' => null]
        )->load('items.product');
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
        $cart->load('items.product.images');

        $items = $cart->items->map(function ($item) {
            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'subtotal' => $item->subtotal,
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'slug' => $item->product->slug,
                    'price' => $item->product->price,
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
