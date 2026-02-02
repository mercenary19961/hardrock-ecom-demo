<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\UndoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        protected UndoService $undoService
    ) {}

    public function index(Request $request): Response
    {
        // Build hierarchically ordered categories (parent followed by children)
        $searchTerm = $request->filled('search') ? $request->search : null;
        $statusFilter = $request->filled('status') ? $request->status : null;

        // Sorting parameters (default: name ascending, keeps parent-child grouping)
        $sortField = $request->input('sort', 'name');
        $sortDir = $request->input('dir', 'asc');

        // Validate sort field
        $allowedSortFields = ['name', 'slug', 'products_count', 'is_active', 'sort_order', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'sort_order';
        }

        // Validate sort direction
        if (!in_array($sortDir, ['asc', 'desc'])) {
            $sortDir = 'asc';
        }

        // Get all categories ordered hierarchically
        $allCategories = collect();

        // First, get parent categories
        $parentQuery = Category::withCount('products')
            ->whereNull('parent_id');

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

        // Apply sorting to parent categories
        if ($sortField === 'products_count') {
            // products_count is added via withCount, so we sort after the query
            $parents = $parentQuery->get()->sortBy([[$sortField, $sortDir]]);
        } else {
            $parentQuery->orderBy($sortField, $sortDir);
            $parents = $parentQuery->get();
        }

        // For each parent, add it and then its children
        foreach ($parents as $parent) {
            // Get children of this parent
            $childQuery = Category::withCount('products')
                ->where('parent_id', $parent->id);

            if ($searchTerm) {
                $childQuery->where('name', 'like', '%' . $searchTerm . '%');
            }

            if ($statusFilter) {
                $childQuery->where('is_active', $statusFilter === 'active');
            }

            // Apply sorting to child categories
            if ($sortField === 'products_count') {
                $children = $childQuery->get()->sortBy([[$sortField, $sortDir]]);
            } else {
                $childQuery->orderBy($sortField, $sortDir);
                $children = $childQuery->get();
            }

            // Calculate total products for parent (parent's own products + all children's products)
            $childrenProductCount = $children->sum('products_count');
            $parent->products_count = $parent->products_count + $childrenProductCount;

            $allCategories->push($parent);

            foreach ($children as $child) {
                $allCategories->push($child);
            }
        }

        // Manual pagination of the hierarchical collection
        $perPage = in_array($request->per_page, ['4', '8', '16', '32', '64', '80'])
            ? (int) $request->per_page
            : 16;

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

        // Calculate stats for the dashboard cards
        $totalCategories = Category::count();
        $stats = [
            'total' => $totalCategories,
            'parents' => Category::whereNull('parent_id')->count(),
            'subcategories' => Category::whereNotNull('parent_id')->count(),
            'active' => $statusCounts['active'],
            'inactive' => $statusCounts['inactive'],
            'empty' => Category::withCount('products')->get()->where('products_count', 0)->count(),
        ];

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            // Cast to object to ensure JSON serializes as {} not [] when empty
            'filters' => (object) $request->only(['search', 'status', 'per_page', 'sort', 'dir']),
            'statusCounts' => $statusCounts,
            'stats' => $stats,
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

        $category = Category::create($data);

        // Log the create activity
        $this->undoService->logActivity($category, 'created');

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function show(Category $category): Response
    {
        // Load parent category if exists
        $category->load('parent');

        return Inertia::render('Admin/Categories/Show', [
            'category' => $category,
        ]);
    }

    public function edit(Category $category): Response
    {
        $parentCategories = Category::whereNull('parent_id')
            ->where('id', '!=', $category->id)
            ->ordered()
            ->get(['id', 'name']);

        // Get undo metadata if available (pass current model for diff computation)
        $undoMeta = $this->undoService->getUndoMeta('category', $category->id, $category);

        // Get active children for cascade warning (only for parent categories)
        $activeChildren = [];
        if ($category->is_active && is_null($category->parent_id)) {
            $activeChildren = $category->children()
                ->where('is_active', true)
                ->get(['id', 'name'])
                ->toArray();
        }

        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories,
            'undoMeta' => $undoMeta,
            'activeChildren' => $activeChildren,
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();

        // Ensure is_active is explicitly set (handles false values in form data)
        $data['is_active'] = $request->boolean('is_active');

        // Store old data for change tracking
        $oldData = $category->toArray();

        // Save current state for undo BEFORE making changes (only if there are actual changes)
        $oldImagePath = $category->image;
        $hasChanges = $this->undoService->saveState($category, $oldImagePath, $data);

        if ($request->hasFile('image')) {
            // Mark old image for potential deletion (will be cleaned up if undo state is cleared)
            if ($category->image) {
                $this->undoService->markImageForDeletion('category', $category->id, $category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
            $hasChanges = true; // Image change counts as a change
        }

        $category->update($data);

        // Log the update activity if there were changes
        if ($hasChanges) {
            $changes = $this->undoService->getChanges($category, $oldData);
            $this->undoService->logActivity($category, 'updated', $changes);
        }

        // Auto-cascade: If parent category is set to inactive and cascade is confirmed,
        // also deactivate all active children
        $cascadedCount = 0;
        if (!$data['is_active'] && $request->boolean('cascade_inactive') && is_null($category->parent_id)) {
            $cascadedCount = $category->children()
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $successMessage = 'Category updated successfully.';
        if ($cascadedCount > 0) {
            $successMessage .= " {$cascadedCount} subcategories were also deactivated.";
        }

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', $successMessage);
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

        // Log the delete activity before deleting
        $this->undoService->logActivity($category, 'deleted');

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
