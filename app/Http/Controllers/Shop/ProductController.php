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

        // Increment view count
        $product->increment('view_count');

        $product->load(['category', 'images']);

        $reviews = $product->reviews()
            ->with('user')
            ->paginate(3)
            ->withQueryString();

        $ratingDistribution = $product->getRatingDistribution();

        $relatedProducts = [];
        if ($product->category_id) {
            $relatedProducts = Product::with(['images'])
                ->where('category_id', $product->category_id)
                ->where('id', '!=', $product->id)
                ->active()
                ->inStock()
                ->take(4)
                ->get();
        }

        $breadcrumbs = [];
        if ($product->category) {
            $breadcrumbs[] = ['name' => $product->category->name, 'slug' => $product->category->slug];
        }
        $breadcrumbs[] = ['name' => $product->name, 'slug' => $product->slug];

        // Check if logged-in user can review (must have purchased and not reviewed yet)
        $canReview = false;
        $userReview = null;
        if (Auth::check()) {
            $userReview = $product->reviews()->where('user_id', Auth::id())->first();
            $canReview = !$userReview && Auth::user()->hasPurchased($product->id);
        }

        return Inertia::render('Shop/Product', [
            'product' => $product,
            'reviews' => $reviews,
            'ratingDistribution' => $ratingDistribution,
            'relatedProducts' => $relatedProducts,
            'breadcrumbs' => $breadcrumbs,
            'canReview' => $canReview,
            'userReview' => $userReview,
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
