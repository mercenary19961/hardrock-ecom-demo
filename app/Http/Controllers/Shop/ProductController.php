<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function show(Product $product): Response
    {
        if (!$product->is_active) {
            abort(404);
        }

        // Increment view count (once per session, prevents deferred prop requests from inflating)
        $sessionKey = 'viewed_product_' . $product->id;
        if (!session()->has($sessionKey)) {
            $product->increment('view_count');
            session()->put($sessionKey, true);
        }

        // Load essential product data immediately
        $product->load(['category', 'images']);

        // Build breadcrumbs immediately (needed for page structure)
        $breadcrumbs = [];
        if ($product->category) {
            $breadcrumbs[] = ['name' => $product->category->name, 'slug' => $product->category->slug];
        }
        $breadcrumbs[] = ['name' => $product->name, 'slug' => $product->slug];

        // Store product ID for closures
        $productId = $product->id;
        $categoryId = $product->category_id;

        return Inertia::render('Shop/Product', [
            // Immediate props - for page structure
            'product' => $product,
            'breadcrumbs' => $breadcrumbs,

            // Deferred: Reviews section
            'reviews' => Inertia::defer(
                fn () => $product->reviews()->with('user')->paginate(3)->withQueryString(),
                'reviews'
            ),
            'ratingDistribution' => Inertia::defer(
                fn () => $product->getRatingDistribution(),
                'reviews'
            ),

            // Deferred: Related products
            'relatedProducts' => Inertia::defer(function () use ($categoryId, $productId) {
                if (!$categoryId) {
                    return [];
                }
                return Product::with(['images'])
                    ->where('category_id', $categoryId)
                    ->where('id', '!=', $productId)
                    ->active()
                    ->inStock()
                    ->take(4)
                    ->get();
            }, 'related'),

            // Deferred: User review status - any authenticated user can review (once)
            'canReview' => Inertia::defer(function () use ($productId) {
                if (!Auth::check()) {
                    return false;
                }
                $hasReview = Product::find($productId)->reviews()->where('user_id', Auth::id())->exists();
                return !$hasReview;
            }, 'userReview'),
            'hasVerifiedPurchase' => Inertia::defer(function () use ($productId) {
                if (!Auth::check()) {
                    return false;
                }
                return Auth::user()->hasPurchased($productId);
            }, 'userReview'),
            'userReview' => Inertia::defer(function () use ($productId) {
                if (!Auth::check()) {
                    return null;
                }
                return Product::find($productId)->reviews()->where('user_id', Auth::id())->first();
            }, 'userReview'),
        ]);
    }

    public function search(Request $request): Response
    {
        $query = $request->get('q', '');

        $products = Product::with(['category', 'images'])
            ->active()
            ->search($query)
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Shop/Search', [
            'products' => $products,
            'query' => $query,
        ]);
    }
}
