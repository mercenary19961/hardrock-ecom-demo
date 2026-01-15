<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\UndoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UndoController extends Controller
{
    public function __construct(
        protected UndoService $undoService
    ) {}

    /**
     * Get undo state metadata for a model.
     */
    public function status(string $model, int $id): JsonResponse
    {
        $meta = $this->undoService->getUndoMeta($model, $id);

        return response()->json([
            'undo' => $meta,
        ]);
    }

    /**
     * Restore a model to its previous state.
     */
    public function restore(Request $request, string $model, int $id): RedirectResponse
    {
        $modelInstance = $this->resolveModel($model, $id);

        if (!$modelInstance) {
            return back()->withErrors(['undo' => 'Model not found.']);
        }

        if (!$this->undoService->hasUndoState($model, $id)) {
            return back()->withErrors(['undo' => 'No undo state available.']);
        }

        $restoredData = $this->undoService->restore($modelInstance);

        if (!$restoredData) {
            return back()->withErrors(['undo' => 'Failed to restore previous state.']);
        }

        // Redirect to the edit page to ensure fresh data is loaded
        $route = match ($model) {
            'category' => route('admin.categories.edit', $id),
            'product' => route('admin.products.edit', $id),
            default => back()->getTargetUrl(),
        };

        return redirect($route)->with('success', ucfirst($model) . ' restored to previous state.');
    }

    /**
     * Clear undo state for a model without restoring.
     */
    public function clear(string $model, int $id): JsonResponse
    {
        $this->undoService->clear($model, $id);

        return response()->json([
            'success' => true,
            'message' => 'Undo state cleared.',
        ]);
    }

    /**
     * Resolve model instance from type and ID.
     */
    private function resolveModel(string $type, int $id): ?object
    {
        return match ($type) {
            'category' => Category::find($id),
            'product' => Product::find($id),
            // Add more models here as needed:
            // 'user' => User::find($id),
            // 'order' => Order::find($id),
            default => null,
        };
    }
}
