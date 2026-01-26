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
            // Find existing item with same product AND variant (color + size)
            $existingItem = $target->items()
                ->where('product_id', $item->product_id)
                ->where('color', $item->color)
                ->where('size', $item->size)
                ->first();

            if ($existingItem) {
                $existingItem->update([
                    'quantity' => $existingItem->quantity + $item->quantity,
                ]);
            } else {
                $target->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'color' => $item->color,
                    'color_hex' => $item->color_hex,
                    'size' => $item->size,
                    'selected_image_id' => $item->selected_image_id,
                ]);
            }
        }
    }

    public function addItem(
        Cart $cart,
        Product $product,
        int $quantity = 1,
        ?string $color = null,
        ?string $colorHex = null,
        ?string $size = null,
        ?int $selectedImageId = null
    ): CartItem {
        // Find existing item with same product AND variant (color + size)
        $existingItem = $cart->items()
            ->where('product_id', $product->id)
            ->where('color', $color)
            ->where('size', $size)
            ->first();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $quantity,
                // Update image if provided (user might select a different image)
                'selected_image_id' => $selectedImageId ?? $existingItem->selected_image_id,
            ]);
            return $existingItem->fresh();
        }

        return $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'color' => $color,
            'color_hex' => $colorHex,
            'size' => $size,
            'selected_image_id' => $selectedImageId,
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
            // Get the appropriate image - selected image or primary
            $image = $item->product->getPrimaryImageUrl();
            if ($item->selected_image_id) {
                $selectedImage = $item->product->images->firstWhere('id', $item->selected_image_id);
                if ($selectedImage) {
                    $image = $selectedImage->url;
                }
            }

            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'subtotal' => $item->subtotal,
                'color' => $item->color,
                'color_hex' => $item->color_hex,
                'size' => $item->size,
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'name_ar' => $item->product->name_ar,
                    'slug' => $item->product->slug,
                    'price' => $item->product->price,
                    'compare_price' => $item->product->compare_price,
                    'stock' => $item->product->stock,
                    'image' => $image,
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
