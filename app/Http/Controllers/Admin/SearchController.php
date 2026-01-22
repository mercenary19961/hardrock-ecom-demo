<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $limit = 5; // Results per category

        if (strlen($query) < 2) {
            return response()->json([
                'products' => [],
                'categories' => [],
                'orders' => [],
            ]);
        }

        // Search products
        $products = Product::where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('name_ar', 'like', "%{$query}%")
                ->orWhere('sku', 'like', "%{$query}%");
        })
            ->select('id', 'name', 'sku', 'price', 'stock', 'is_active')
            ->limit($limit)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'price' => $p->price,
                'stock' => $p->stock,
                'is_active' => $p->is_active,
                'url' => "/admin/products/{$p->id}/edit",
            ]);

        // Search categories
        $categories = Category::where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('name_ar', 'like', "%{$query}%")
                ->orWhere('slug', 'like', "%{$query}%");
        })
            ->select('id', 'name', 'slug', 'is_active')
            ->withCount('products')
            ->limit($limit)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'is_active' => $c->is_active,
                'products_count' => $c->products_count,
                'url' => "/admin/categories/{$c->id}/edit",
            ]);

        // Search orders
        $orders = Order::where(function ($q) use ($query) {
            $q->where('order_number', 'like', "%{$query}%")
                ->orWhere('customer_name', 'like', "%{$query}%")
                ->orWhere('customer_email', 'like', "%{$query}%")
                ->orWhere('customer_phone', 'like', "%{$query}%");
        })
            ->select('id', 'order_number', 'customer_name', 'total', 'status', 'created_at')
            ->limit($limit)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_name' => $o->customer_name,
                'total' => $o->total,
                'status' => $o->status,
                'created_at' => $o->created_at->format('M d, Y'),
                'url' => "/admin/orders/{$o->id}",
            ]);

        return response()->json([
            'products' => $products,
            'categories' => $categories,
            'orders' => $orders,
        ]);
    }
}
