<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ProductsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Setting;
use App\Services\ActivityLogService;
use App\Services\UndoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
                $globalThreshold = (int) Setting::get('low_stock_threshold', 10);
                $query->where('stock', '>', 0)
                    ->whereRaw('stock <= COALESCE(products.low_stock_threshold, (SELECT low_stock_threshold FROM categories WHERE categories.id = products.category_id), ?)', [$globalThreshold]);
            } elseif ($request->status === 'on_sale') {
                $query->whereNotNull('compare_price')
                    ->whereColumn('compare_price', '>', 'price');
            } elseif ($request->status === 'featured') {
                $query->where('is_featured', true);
            }
        }

        // Sorting - supports sort + dir pattern like ReviewController
        $sortField = $request->get('sort', 'name');
        $sortDir = $request->get('dir', 'desc');
        $direction = $sortDir === 'asc' ? 'asc' : 'desc';

        // Allowed sort fields for security
        $allowedSortFields = ['name', 'price', 'stock', 'average_rating', 'created_at', 'times_purchased', 'category'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'name';
        }

        // Handle sorting by related model fields
        if ($sortField === 'name') {
            $query->orderBy('name', $direction);
        } elseif ($sortField === 'category') {
            // Sort by category name using a subquery
            $query->orderBy(
                Category::select('name')
                    ->whereColumn('categories.id', 'products.category_id')
                    ->limit(1),
                $direction
            );
        } elseif ($sortField === 'average_rating') {
            // Secondary sort by rating_count for tie-breaking
            $query->orderBy('average_rating', $direction)
                ->orderBy('rating_count', $direction);
        } else {
            $query->orderBy($sortField, $direction);
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

        // Calculate stats for the dashboard cards
        $globalThreshold = (int) Setting::get('low_stock_threshold', 10);

        $stats = [
            'total' => Product::count(),
            'active' => Product::where('is_active', true)->count(),
            'out_of_stock' => Product::where('stock', 0)->count(),
            'low_stock' => Product::where('stock', '>', 0)
                ->whereRaw('stock <= COALESCE(products.low_stock_threshold, (SELECT low_stock_threshold FROM categories WHERE categories.id = products.category_id), ?)', [$globalThreshold])
                ->count(),
            'featured' => Product::where('is_featured', true)->count(),
            'on_sale' => Product::whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price')
                ->count(),
        ];

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            // Cast to object to ensure JSON serializes as {} not [] when empty
            'filters' => (object) $request->only(['search', 'category', 'status', 'per_page', 'sort', 'dir']),
            'stats' => $stats,
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
        // Optimistic locking: check if product was modified since the admin loaded the page
        if ($request->filled('loaded_at')) {
            $loadedAt = $request->input('loaded_at');
            $currentUpdatedAt = $product->fresh()->updated_at->toISOString();

            if ($loadedAt !== $currentUpdatedAt) {
                return back()->withErrors([
                    'conflict' => 'This product was modified while you were editing it. Please refresh the page to see the latest data before making changes.',
                ]);
            }
        }

        $data = $request->validated();
        unset($data['images'], $data['delete_images'], $data['image_order'], $data['image_colors'], $data['loaded_at']);

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
            $type = $change['type'] ?? 'text';

            // For json/array fields, use old_data (the actual data structure)
            // instead of old (which is a display string like "28 variants, 477 total")
            if (($type === 'json' || $type === 'array') && array_key_exists('old_data', $change)) {
                $restoreData[$field] = is_array($change['old_data']) ? $change['old_data'] : [];
                continue;
            }

            $oldValue = $change['old'] ?? null;

            // Treat "(empty)" placeholder as null
            if ($oldValue === '(empty)' || $oldValue === '') {
                $oldValue = null;
            }

            // Convert values back to appropriate types
            if ($type === 'boolean') {
                $restoreData[$field] = $oldValue !== null ? filter_var($oldValue, FILTER_VALIDATE_BOOLEAN) : false;
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

    /**
     * Export products to CSV, Excel, or JSON format
     */
    public function export(Request $request): StreamedResponse|BinaryFileResponse
    {
        $query = Product::with(['category.parent', 'primaryImage', 'images']);

        // Apply same filters as index()
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('category')) {
            $categoryId = $request->category;
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
                $globalThreshold = (int) Setting::get('low_stock_threshold', 10);
                $query->where('stock', '>', 0)
                    ->whereRaw('stock <= COALESCE(products.low_stock_threshold, (SELECT low_stock_threshold FROM categories WHERE categories.id = products.category_id), ?)', [$globalThreshold]);
            } elseif ($request->status === 'on_sale') {
                $query->whereNotNull('compare_price')
                    ->whereColumn('compare_price', '>', 'price');
            } elseif ($request->status === 'featured') {
                $query->where('is_featured', true);
            }
        }

        // If specific IDs are provided (for selected export)
        if ($request->filled('product_ids')) {
            $query->whereIn('id', $request->product_ids);
        }

        $products = $query->orderBy('name')->get();

        $format = $request->input('format', 'csv');
        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'json' => $this->exportJson($products, $timestamp),
            'xlsx' => $this->exportExcel($products, $timestamp),
            default => $this->exportCsv($products, $timestamp),
        };
    }

    /**
     * Export products as CSV
     */
    private function exportCsv($products, string $timestamp): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"products-{$timestamp}.csv\"",
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');

            // Add UTF-8 BOM for proper Arabic display in Excel
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, [
                'ID',
                'SKU',
                'Slug',
                'Name',
                'Name (AR)',
                'Short Description',
                'Short Description (AR)',
                'Description',
                'Description (AR)',
                'Category',
                'Subcategory',
                'Price',
                'Compare Price',
                'Discount %',
                'Stock',
                'Low Stock Threshold',
                'Status',
                'Featured',
                'Color',
                'Color Hex',
                'Available Sizes',
                'Size Stock',
                'Available Colors',
                'Variant Stock',
                'Product Group',
                'Times Purchased',
                'Avg Rating',
                'Review Count',
                'View Count',
                'Primary Image',
                'Created At',
                'Updated At',
            ]);

            // Data rows
            foreach ($products as $product) {
                $discountPercent = '';
                if ($product->compare_price && $product->compare_price > $product->price) {
                    $discountPercent = round((($product->compare_price - $product->price) / $product->compare_price) * 100, 1) . '%';
                }

                $sizeStock = '';
                if ($product->size_stock && is_array($product->size_stock)) {
                    $sizeStock = collect($product->size_stock)
                        ->map(fn($qty, $size) => "{$size}:{$qty}")
                        ->join(', ');
                }

                $availableSizes = '';
                if ($product->available_sizes && is_array($product->available_sizes)) {
                    $availableSizes = implode(', ', $product->available_sizes);
                }

                $availableColors = '';
                if ($product->available_colors && is_array($product->available_colors)) {
                    $availableColors = collect($product->available_colors)
                        ->map(fn($color) => $color['name'] ?? $color)
                        ->join(', ');
                }

                $variantStock = '';
                if ($product->variant_stock && is_array($product->variant_stock)) {
                    $variantStock = collect($product->variant_stock)
                        ->map(fn($qty, $key) => "{$key}:{$qty}")
                        ->join(', ');
                }

                // Get subcategory (if category has a parent, then category is subcategory)
                $category = $product->category;
                $categoryName = '';
                $subcategoryName = '';
                if ($category) {
                    if ($category->parent_id) {
                        $subcategoryName = $category->name;
                        $categoryName = $category->parent?->name ?? '';
                    } else {
                        $categoryName = $category->name;
                    }
                }

                fputcsv($file, [
                    $product->id,
                    $product->sku,
                    $product->slug ?? '',
                    $product->name,
                    $product->name_ar ?? '',
                    $product->short_description ?? '',
                    $product->short_description_ar ?? '',
                    $product->description ?? '',
                    $product->description_ar ?? '',
                    $categoryName,
                    $subcategoryName,
                    number_format($product->price, 2),
                    $product->compare_price ? number_format($product->compare_price, 2) : '',
                    $discountPercent,
                    $product->stock,
                    $product->low_stock_threshold ?? '',
                    $product->is_active ? 'Active' : 'Inactive',
                    $product->is_featured ? 'Yes' : 'No',
                    $product->color ?? '',
                    $product->color_hex ?? '',
                    $availableSizes,
                    $sizeStock,
                    $availableColors,
                    $variantStock,
                    $product->product_group ?? '',
                    $product->times_purchased,
                    $product->average_rating ? number_format($product->average_rating, 1) : '',
                    $product->rating_count,
                    $product->view_count,
                    ($product->slug ?? '') . '.webp',
                    $product->created_at->format('Y-m-d H:i:s'),
                    $product->updated_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export products as Excel (HTML table format - opens in Excel without dependencies)
     */
    private function exportExcel($products, string $timestamp): BinaryFileResponse
    {
        return Excel::download(
            new ProductsExport($products),
            "products-{$timestamp}.xlsx"
        );
    }

    /**
     * Export products as JSON
     */
    private function exportJson($products, string $timestamp): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Content-Disposition' => "attachment; filename=\"products-{$timestamp}.json\"",
        ];

        $callback = function () use ($products) {
            $data = $products->map(function ($product) {
                $discountPercent = null;
                if ($product->compare_price && $product->compare_price > $product->price) {
                    $discountPercent = round((($product->compare_price - $product->price) / $product->compare_price) * 100, 1);
                }

                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'name_ar' => $product->name_ar,
                    'category' => $product->category?->name,
                    'category_id' => $product->category_id,
                    'price' => (float) $product->price,
                    'compare_price' => $product->compare_price ? (float) $product->compare_price : null,
                    'discount_percent' => $discountPercent,
                    'stock' => $product->stock,
                    'size_stock' => $product->size_stock,
                    'is_active' => $product->is_active,
                    'is_featured' => $product->is_featured,
                    'color' => $product->color,
                    'color_hex' => $product->color_hex,
                    'available_sizes' => $product->available_sizes,
                    'times_purchased' => $product->times_purchased,
                    'average_rating' => $product->average_rating ? (float) $product->average_rating : null,
                    'rating_count' => $product->rating_count,
                    'view_count' => $product->view_count,
                    'created_at' => $product->created_at->toISOString(),
                    'updated_at' => $product->updated_at->toISOString(),
                    'primary_image' => $product->primaryImage?->path,
                ];
            });

            echo json_encode([
                'exported_at' => now()->toISOString(),
                'count' => $data->count(),
                'products' => $data->values(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        };

        return response()->stream($callback, 200, $headers);
    }
}
