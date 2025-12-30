<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
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

        return Inertia::render('Shop/Product', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'breadcrumbs' => $breadcrumbs,
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
