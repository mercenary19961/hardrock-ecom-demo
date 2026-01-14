<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        // Build hierarchically ordered categories (parent followed by children)
        $searchTerm = $request->filled('search') ? $request->search : null;
        $statusFilter = $request->filled('status') ? $request->status : null;

        // Get all categories ordered hierarchically
        $allCategories = collect();

        // First, get parent categories
        $parentQuery = Category::withCount('products')
            ->whereNull('parent_id')
            ->ordered();

        if ($searchTerm) {
            // When searching, include parents that match OR have matching children
            $matchingChildParentIds = Category::where('name', 'like', '%' . $searchTerm . '%')
                ->whereNotNull('parent_id')
                ->pluck('parent_id')
                ->unique();

            $parentQuery->where(function ($q) use ($searchTerm, $matchingChildParentIds) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhereIn('id', $matchingChildParentIds);
            });
        }

        if ($statusFilter) {
            $parentQuery->where('is_active', $statusFilter === 'active');
        }

        $parents = $parentQuery->get();

        // For each parent, add it and then its children
        foreach ($parents as $parent) {
            // Get children of this parent
            $childQuery = Category::withCount('products')
                ->where('parent_id', $parent->id)
                ->ordered();

            if ($searchTerm) {
                $childQuery->where('name', 'like', '%' . $searchTerm . '%');
            }

            if ($statusFilter) {
                $childQuery->where('is_active', $statusFilter === 'active');
            }

            $children = $childQuery->get();

            // Calculate total products for parent (parent's own products + all children's products)
            $childrenProductCount = $children->sum('products_count');
            $parent->products_count = $parent->products_count + $childrenProductCount;

            $allCategories->push($parent);

            foreach ($children as $child) {
                $allCategories->push($child);
            }
        }

        // Manual pagination of the hierarchical collection
        $perPage = in_array($request->per_page, ['10', '15', '25', '50', '100'])
            ? (int) $request->per_page
            : 15;

        $page = $request->input('page', 1);
        $total = $allCategories->count();
        $items = $allCategories->slice(($page - 1) * $perPage, $perPage)->values();

        $categories = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Get counts for status filters
        $statusCounts = [
            'active' => Category::where('is_active', true)->count(),
            'inactive' => Category::where('is_active', false)->count(),
        ];

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'per_page']),
            'statusCounts' => $statusCounts,
        ]);
    }

    public function create(): Response
    {
        $parentCategories = Category::whereNull('parent_id')
            ->ordered()
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Create', [
            'parentCategories' => $parentCategories,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        Category::create($data);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function edit(Category $category): Response
    {
        $parentCategories = Category::whereNull('parent_id')
            ->where('id', '!=', $category->id)
            ->ordered()
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories,
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        // Check if category has child categories
        if ($category->children()->exists()) {
            return back()->withErrors(['category' => 'Cannot delete category with subcategories. Delete the subcategories first.']);
        }

        // Check if category has products
        if ($category->products()->exists()) {
            return back()->withErrors(['category' => 'Cannot delete category with products. Move or delete the products first.']);
        }

        // Delete image
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
