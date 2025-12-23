<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function show(Request $request, Category $category): Response
    {
        if (!$category->is_active) {
            abort(404);
        }

        $query = $category->products()
            ->with(['images'])
            ->active()
            ->inStock();

        // Sorting
        $sort = $request->get('sort', 'newest');
        $query = match ($sort) {
            'price_low' => $query->orderBy('price', 'asc'),
            'price_high' => $query->orderBy('price', 'desc'),
            'name' => $query->orderBy('name', 'asc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $products = $query->paginate(12)->withQueryString();

        $subcategories = $category->children()->active()->ordered()->get();

        $breadcrumbs = $this->buildBreadcrumbs($category);

        return Inertia::render('Shop/Category', [
            'category' => $category,
            'products' => $products,
            'subcategories' => $subcategories,
            'breadcrumbs' => $breadcrumbs,
            'sort' => $sort,
        ]);
    }

    protected function buildBreadcrumbs(Category $category): array
    {
        $breadcrumbs = [];
        $current = $category;

        while ($current) {
            array_unshift($breadcrumbs, [
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }
}
