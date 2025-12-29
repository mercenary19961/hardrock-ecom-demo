<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $featuredProducts = Product::with(['category', 'images'])
            ->active()
            ->featured()
            ->take(8)
            ->get();

        $categories = Category::active()
            ->parents()
            ->ordered()
            ->withCount('activeProducts')
            ->get();

        return Inertia::render('Shop/Home', [
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
        ]);
    }
}
