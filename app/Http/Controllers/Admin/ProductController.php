<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ActivityLogService;
use App\Services\UndoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        protected UndoService $undoService,
        protected ActivityLogService $activityLogService
    ) {}
    public function index(Request $request): Response
    {
        $query = Product::with(['category', 'primaryImage']);

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('category')) {
            $categoryId = $request->category;
            // Get child category IDs if this is a parent category
            $childIds = Category::where('parent_id', $categoryId)->pluck('id')->toArray();
            $categoryIds = array_merge([$categoryId], $childIds);
            $query->whereIn('category_id', $categoryIds);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($request->status === 'out_of_stock') {
                $query->where('stock', 0);
            } elseif ($request->status === 'low_stock') {
                $query->where('stock', '>', 0)
                    ->whereRaw('stock <= COALESCE(products.low_stock_threshold, (SELECT low_stock_threshold FROM categories WHERE categories.id = products.category_id), 10)');
            } elseif ($request->status === 'on_sale') {
                $query->whereNotNull('compare_price')
                    ->whereColumn('compare_price', '>', 'price');
            } elseif ($request->status === 'featured') {
                $query->where('is_featured', true);
            }
        }

        // Sorting
        $sortField = $request->input('sort', 'newest');
        switch ($sortField) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'popularity':
                $query->orderBy('times_purchased', 'desc');
                break;
            case 'rating':
                $query->orderBy('average_rating', 'desc')->orderBy('rating_count', 'desc');
                break;
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = in_array($request->per_page, ['4', '8', '16', '32', '64', '80'])
            ? (int) $request->per_page
            : 16;

        $products = $query->paginate($perPage)->withQueryString();

        // Add effective threshold to each product
        $products->getCollection()->transform(function ($product) {
            $product->effective_low_stock_threshold = $product->getEffectiveLowStockThreshold();
            return $product;
        });

        $categories = Category::with('children:id,name,parent_id,sort_order')
            ->whereNull('parent_id')
            ->ordered()
            ->get(['id', 'name', 'parent_id', 'sort_order']);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'per_page', 'sort']),
        ]);
    }

    public function create(Request $request): Response
    {
        $categories = Category::ordered()->get(['id', 'name', 'parent_id']);

        $duplicateProduct = null;
        if ($request->filled('duplicate')) {
            $sourceProduct = Product::find($request->duplicate);
            if ($sourceProduct) {
                $duplicateProduct = [
                    'category_id' => $sourceProduct->category_id,
                    'name' => $sourceProduct->name . ' (Copy)',
                    'name_ar' => $sourceProduct->name_ar ? $sourceProduct->name_ar . ' (نسخة)' : '',
                    'description' => $sourceProduct->description,
                    'description_ar' => $sourceProduct->description_ar,
                    'short_description' => $sourceProduct->short_description,
                    'short_description_ar' => $sourceProduct->short_description_ar,
                    'price' => $sourceProduct->price,
                    'compare_price' => $sourceProduct->compare_price,
                    'stock' => $sourceProduct->stock,
                    'low_stock_threshold' => $sourceProduct->low_stock_threshold,
                    'is_active' => false, // Default to inactive for duplicates
                    'is_featured' => false,
                    'color' => $sourceProduct->color,
                    'color_hex' => $sourceProduct->color_hex,
                    'available_sizes' => $sourceProduct->available_sizes,
                    'size_stock' => $sourceProduct->size_stock,
                    'product_group' => $sourceProduct->product_group,
                ];
            }
        }

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
            'duplicateProduct' => $duplicateProduct,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        unset($data['images']);

        $product = Product::create($data);

        // Handle images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'sort_order' => $index,
                    'is_primary' => $index === 0,
                ]);
            }
        }

        // Log the create activity
        $this->undoService->logActivity($product, 'created');

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function edit(Product $product): Response
    {
        $product->load(['images', 'category']);
        $categories = Category::ordered()->get(['id', 'name', 'parent_id', 'low_stock_threshold']);

        // Get undo metadata for this product
        $undoMeta = $this->undoService->getUndoMeta('product', $product->id, $product);

        // Get activity history for this product
        $activityLogs = $this->activityLogService->getModelActivities('Product', $product->id, 10);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'undoMeta' => $undoMeta,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        unset($data['images'], $data['delete_images'], $data['image_order'], $data['image_colors']);

        // Store old data for change tracking
        $oldData = $product->toArray();

        // Save undo state before updating (only if there are actual changes)
        $hasChanges = $this->undoService->saveState($product, null, $data);

        $product->update($data);

        // Log the update activity if there were changes
        if ($hasChanges) {
            $changes = $this->undoService->getChanges($product, $oldData);
            $this->undoService->logActivity($product, 'updated', $changes);
        }

        // Handle image deletions
        if ($request->has('delete_images')) {
            foreach ($request->delete_images as $imageId) {
                $image = ProductImage::find($imageId);
                if ($image && $image->product_id === $product->id) {
                    Storage::disk('public')->delete($image->path);
                    $image->delete();
                }
            }
        }

        // Handle image reordering
        if ($request->has('image_order') && is_array($request->image_order)) {
            foreach ($request->image_order as $index => $imageId) {
                ProductImage::where('id', $imageId)
                    ->where('product_id', $product->id)
                    ->update([
                        'sort_order' => $index,
                        'is_primary' => $index === 0, // First image is primary
                    ]);
            }
        }

        // Handle image color assignments
        if ($request->has('image_colors') && is_array($request->image_colors)) {
            foreach ($request->image_colors as $imageId => $color) {
                ProductImage::where('id', $imageId)
                    ->where('product_id', $product->id)
                    ->update([
                        'color' => $color ?: null, // Convert empty string to null
                    ]);
            }
        }

        // Handle new images
        if ($request->hasFile('images')) {
            $maxOrder = $product->images()->max('sort_order') ?? -1;
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'sort_order' => $maxOrder + $index + 1,
                    'is_primary' => false,
                ]);
            }
        }

        // Set primary image if none exists (fallback)
        if (!$product->images()->where('is_primary', true)->exists()) {
            $product->images()->orderBy('sort_order')->first()?->update(['is_primary' => true]);
        }

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        // Check if product is in any pending/processing orders
        $activeOrderStatuses = ['pending', 'processing', 'shipped'];
        $hasActiveOrders = $product->orderItems()
            ->whereHas('order', function ($query) use ($activeOrderStatuses) {
                $query->whereIn('status', $activeOrderStatuses);
            })
            ->exists();

        if ($hasActiveOrders) {
            return back()->withErrors(['product' => 'Cannot delete product with active orders (pending, processing, or shipped).']);
        }

        // Check if product is in any customer carts
        if ($product->cartItems()->exists()) {
            return back()->withErrors(['product' => 'Cannot delete product that is in customer carts. Remove from carts first or wait for checkout.']);
        }

        // Log the delete activity before deleting
        $this->undoService->logActivity($product, 'deleted');

        // Delete all product images
        foreach ($product->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function toggleFeatured(Product $product): RedirectResponse
    {
        $product->update(['is_featured' => !$product->is_featured]);

        return back()->with('success', $product->is_featured ? 'Product marked as featured.' : 'Product removed from featured.');
    }

    public function toggleActive(Product $product): RedirectResponse
    {
        $product->update(['is_active' => !$product->is_active]);

        return back()->with('success', $product->is_active ? 'Product activated.' : 'Product deactivated.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $request->validate([
            'action' => 'required|in:activate,deactivate,feature,unfeature,delete',
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'exists:products,id',
        ]);

        $productIds = $request->product_ids;
        $action = $request->action;
        $count = count($productIds);

        switch ($action) {
            case 'activate':
                Product::whereIn('id', $productIds)->update(['is_active' => true]);
                return back()->with('success', "{$count} product(s) activated.");

            case 'deactivate':
                Product::whereIn('id', $productIds)->update(['is_active' => false]);
                return back()->with('success', "{$count} product(s) deactivated.");

            case 'feature':
                Product::whereIn('id', $productIds)->update(['is_featured' => true]);
                return back()->with('success', "{$count} product(s) marked as featured.");

            case 'unfeature':
                Product::whereIn('id', $productIds)->update(['is_featured' => false]);
                return back()->with('success', "{$count} product(s) removed from featured.");

            case 'delete':
                $activeOrderStatuses = ['pending', 'processing', 'shipped'];
                $deletedCount = 0;
                $skippedCount = 0;

                foreach ($productIds as $productId) {
                    $product = Product::with('images')->find($productId);
                    if (!$product) continue;

                    // Check for active orders
                    $hasActiveOrders = $product->orderItems()
                        ->whereHas('order', function ($query) use ($activeOrderStatuses) {
                            $query->whereIn('status', $activeOrderStatuses);
                        })
                        ->exists();

                    // Check for cart items
                    if ($hasActiveOrders || $product->cartItems()->exists()) {
                        $skippedCount++;
                        continue;
                    }

                    // Delete images
                    foreach ($product->images as $image) {
                        Storage::disk('public')->delete($image->path);
                    }

                    $product->delete();
                    $deletedCount++;
                }

                $message = "{$deletedCount} product(s) deleted.";
                if ($skippedCount > 0) {
                    $message .= " {$skippedCount} skipped (active orders or in carts).";
                }
                return back()->with('success', $message);
        }

        return back();
    }

    /**
     * Restore product to a previous state from activity log
     */
    public function restoreFromActivity(Product $product, ActivityLog $activityLog): RedirectResponse
    {
        // Verify the activity log belongs to this product
        if ($activityLog->model_type !== 'Product' || $activityLog->model_id !== $product->id) {
            return back()->withErrors(['error' => 'Invalid activity log for this product.']);
        }

        // Only allow restore from 'updated' activities
        if ($activityLog->action !== 'updated') {
            return back()->withErrors(['error' => 'Can only restore from update activities.']);
        }

        // Get the changes from the activity log
        $changes = $activityLog->changes;
        if (empty($changes)) {
            return back()->withErrors(['error' => 'No changes found in this activity log.']);
        }

        // Store current state before restoring
        $oldData = $product->toArray();

        // Build the restore data from old values in changes
        $restoreData = [];
        foreach ($changes as $change) {
            $field = $change['field'];
            $oldValue = $change['old'] ?? null;
            $type = $change['type'] ?? 'text';

            // Treat "(empty)" placeholder as null
            if ($oldValue === '(empty)' || $oldValue === '') {
                $oldValue = null;
            }

            // Convert values back to appropriate types
            if ($type === 'boolean') {
                $restoreData[$field] = $oldValue !== null ? filter_var($oldValue, FILTER_VALIDATE_BOOLEAN) : false;
            } elseif ($type === 'json' || $type === 'array') {
                if (is_string($oldValue)) {
                    $decoded = json_decode($oldValue, true);
                    $restoreData[$field] = $decoded !== null ? $decoded : $oldValue;
                } else {
                    $restoreData[$field] = $oldValue;
                }
            } elseif (in_array($field, ['price', 'compare_price'])) {
                $restoreData[$field] = $oldValue !== null ? (float) $oldValue : null;
            } elseif (in_array($field, ['stock', 'category_id', 'view_count', 'times_purchased', 'rating_count', 'low_stock_threshold'])) {
                $restoreData[$field] = $oldValue !== null ? (int) $oldValue : null;
            } else {
                $restoreData[$field] = $oldValue;
            }
        }

        // Save undo state before restoring (so user can undo the restore)
        $this->undoService->saveState($product, null, $restoreData);

        // Update the product
        $product->update($restoreData);

        // Log the restore activity
        $restoredChanges = $this->undoService->getChanges($product, $oldData);
        $this->activityLogService->log($product, 'restored', $restoredChanges);

        return back()->with('success', 'Product restored to previous state.');
    }
}
