<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UndoService
{
    protected ?ActivityLogService $activityLogService = null;

    /**
     * Get the activity log service (lazy loaded).
     */
    protected function getActivityLogService(): ActivityLogService
    {
        if (!$this->activityLogService) {
            $this->activityLogService = app(ActivityLogService::class);
        }
        return $this->activityLogService;
    }

    /**
     * Log an activity for a model update.
     * Call this AFTER saving changes to the model.
     */
    public function logActivity(Model $model, string $action, array $changes = []): ?ActivityLog
    {
        try {
            return $this->getActivityLogService()->log($model, $action, $changes);
        } catch (\Exception $e) {
            // Silently fail if activity logging fails (don't break the main operation)
            report($e);
            return null;
        }
    }

    /**
     * Get changes between old data and current model.
     * Useful for logging what changed during an update.
     */
    public function getChanges(Model $model, array $oldData): array
    {
        $modelType = $this->getModelType($model);
        return $this->computeChanges($modelType, $oldData, $model->toArray());
    }

    /**
     * Save the current state of a model before updating.
     * Call this BEFORE making changes to the model.
     *
     * @param Model $model The model to save state for
     * @param string|null $oldImagePath Optional image path to track for restoration
     * @param array|null $newData Optional new data to compare - only saves if different
     * @return bool True if state was saved, false if skipped (no changes)
     */
    public function saveState(Model $model, ?string $oldImagePath = null, ?array $newData = null): bool
    {
        $modelType = $this->getModelType($model);
        $key = $this->getSessionKey($modelType, $model->getKey());

        // If newData provided, check if there are actual changes
        if ($newData !== null) {
            $currentData = $model->toArray();
            $hasChanges = false;

            foreach ($newData as $field => $newValue) {
                $currentValue = $currentData[$field] ?? null;

                // Normalize values for comparison
                $normalizedNew = $this->normalizeValue($newValue);
                $normalizedCurrent = $this->normalizeValue($currentValue);

                if ($normalizedCurrent !== $normalizedNew) {
                    $hasChanges = true;
                    break;
                }
            }

            if (!$hasChanges) {
                // No actual changes, don't save undo state
                return false;
            }
        }

        // If there's an existing undo state with pending image delete, clean it up
        $this->cleanupPendingImages($modelType, $model->getKey());

        $state = [
            'data' => $model->toArray(),
            'saved_at' => now()->toIso8601String(),
            'saved_by' => Auth::id(),
            'old_image_path' => $oldImagePath, // Track image that might need restoration
        ];

        session()->put($key, $state);
        return true;
    }

    /**
     * Check if undo state exists for a model.
     */
    public function hasUndoState(string $modelType, int|string $id): bool
    {
        $key = $this->getSessionKey($modelType, $id);
        return session()->has($key);
    }

    /**
     * Get the undo state for a model.
     */
    public function getUndoState(string $modelType, int|string $id): ?array
    {
        $key = $this->getSessionKey($modelType, $id);
        return session()->get($key);
    }

    /**
     * Restore a model to its previous state.
     * Returns the restored data array.
     */
    public function restore(Model $model): ?array
    {
        $modelType = $this->getModelType($model);
        $key = $this->getSessionKey($modelType, $model->getKey());

        $state = session()->get($key);

        if (!$state) {
            return null;
        }

        $data = $state['data'];

        // Get current image before restore (this will be orphaned after restore)
        $currentImage = $model->image ?? null;

        // Remove fields that shouldn't be mass-updated
        unset($data['id'], $data['created_at'], $data['updated_at']);

        // Filter to only include fillable fields to avoid issues with relationships/accessors
        $fillable = $model->getFillable();
        $filteredData = array_intersect_key($data, array_flip($fillable));

        // Get current data before restore for logging
        $currentData = $model->toArray();

        // Update the model with restored data
        $model->fill($filteredData);
        $model->save();

        // Handle image cleanup: delete the current image if it differs from restored
        if ($currentImage && $currentImage !== ($filteredData['image'] ?? null)) {
            // Current image is different from restored, so delete current
            Storage::disk('public')->delete($currentImage);
        }

        // Log the restore activity
        $changes = $this->computeChanges($modelType, $currentData, $model->toArray());
        $this->logActivity($model, 'restored', $changes);

        // Clear the undo state
        session()->forget($key);

        return $filteredData;
    }

    /**
     * Clear undo state for a model without restoring.
     * Also cleans up any pending image deletes.
     */
    public function clear(string $modelType, int|string $id): void
    {
        $this->cleanupPendingImages($modelType, $id);
        $key = $this->getSessionKey($modelType, $id);
        session()->forget($key);
    }

    /**
     * Mark an old image path for potential deletion.
     * The image won't be deleted immediately - only when undo state is cleared.
     */
    public function markImageForDeletion(string $modelType, int|string $id, string $imagePath): void
    {
        $pendingKey = "undo_pending_delete_{$modelType}_{$id}";
        session()->put($pendingKey, $imagePath);
    }

    /**
     * Get undo metadata for frontend display, including changes diff.
     */
    public function getUndoMeta(string $modelType, int|string $id, ?Model $currentModel = null): ?array
    {
        $state = $this->getUndoState($modelType, $id);

        if (!$state) {
            return null;
        }

        $changes = [];
        if ($currentModel) {
            $changes = $this->computeChanges($modelType, $state['data'], $currentModel->toArray());
        }

        // Look up user who made the changes
        $savedByUser = null;
        if ($state['saved_by']) {
            $user = User::find($state['saved_by']);
            if ($user) {
                $savedByUser = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            }
        }

        return [
            'available' => true,
            'saved_at' => $state['saved_at'],
            'saved_by' => $state['saved_by'],
            'saved_by_user' => $savedByUser,
            'changes' => $changes,
        ];
    }

    /**
     * Compute the differences between old and current state.
     */
    private function computeChanges(string $modelType, array $oldData, array $currentData): array
    {
        $fieldConfig = $this->getFieldConfig($modelType);
        $changes = [];

        foreach ($fieldConfig as $field => $config) {
            $oldValue = $oldData[$field] ?? null;
            $newValue = $currentData[$field] ?? null;

            // Skip if values are the same (handle arrays/JSON specially)
            if ($config['type'] === 'array' || $config['type'] === 'json') {
                $oldNorm = is_array($oldValue) ? $oldValue : [];
                $newNorm = is_array($newValue) ? $newValue : [];
                if (json_encode($oldNorm) === json_encode($newNorm)) {
                    continue;
                }
            } elseif ($oldValue === $newValue) {
                continue;
            }

            // Handle different field types
            $change = [
                'field' => $field,
                'label' => $config['label'],
                'type' => $config['type'],
            ];

            switch ($config['type']) {
                case 'boolean':
                    $change['old'] = $oldValue ? ($config['true_label'] ?? 'Yes') : ($config['false_label'] ?? 'No');
                    $change['new'] = $newValue ? ($config['true_label'] ?? 'Yes') : ($config['false_label'] ?? 'No');
                    break;

                case 'image':
                    $change['old'] = $oldValue ? 'Custom image' : 'No image';
                    $change['new'] = $newValue ? 'Custom image' : 'No image';
                    $change['old_path'] = $oldValue;
                    $change['new_path'] = $newValue;
                    break;

                case 'select':
                    // For selects, we store the raw value - frontend can resolve labels
                    $change['old'] = $oldValue ?: ($config['empty_label'] ?? 'None');
                    $change['new'] = $newValue ?: ($config['empty_label'] ?? 'None');
                    $change['old_id'] = $oldValue;
                    $change['new_id'] = $newValue;
                    break;

                case 'array':
                    // Handle array fields (like sizes, colors)
                    $oldArr = is_array($oldValue) ? $oldValue : [];
                    $newArr = is_array($newValue) ? $newValue : [];

                    // Store raw data for restoration before extracting display names
                    $change['old_data'] = $oldArr;
                    $change['new_data'] = $newArr;

                    // For colors array, extract just the names for display
                    if ($field === 'available_colors') {
                        $oldArr = array_map(fn($c) => is_array($c) ? ($c['name'] ?? '') : $c, $oldArr);
                        $newArr = array_map(fn($c) => is_array($c) ? ($c['name'] ?? '') : $c, $newArr);
                    }

                    $change['old'] = empty($oldArr) ? '(none)' : implode(', ', $oldArr);
                    $change['new'] = empty($newArr) ? '(none)' : implode(', ', $newArr);
                    $change['old_count'] = count($oldArr);
                    $change['new_count'] = count($newArr);
                    break;

                case 'json':
                    // Handle JSON/object fields (like variant_stock)
                    $oldObj = is_array($oldValue) ? $oldValue : [];
                    $newObj = is_array($newValue) ? $newValue : [];
                    $oldTotal = array_sum(array_map('intval', $oldObj));
                    $newTotal = array_sum(array_map('intval', $newObj));
                    $change['old'] = empty($oldObj) ? '(none)' : count($oldObj) . ' variants, ' . $oldTotal . ' total';
                    $change['new'] = empty($newObj) ? '(none)' : count($newObj) . ' variants, ' . $newTotal . ' total';
                    $change['old_data'] = $oldObj;
                    $change['new_data'] = $newObj;
                    break;

                case 'text':
                case 'textarea':
                default:
                    // Truncate long text for display
                    $maxLength = $config['type'] === 'textarea' ? 50 : 30;
                    $change['old'] = $oldValue ? $this->truncate((string) $oldValue, $maxLength) : '(empty)';
                    $change['new'] = $newValue ? $this->truncate((string) $newValue, $maxLength) : '(empty)';
                    break;
            }

            $changes[] = $change;
        }

        return $changes;
    }

    /**
     * Get field configuration for each model type.
     * This defines which fields to track and how to display them.
     */
    private function getFieldConfig(string $modelType): array
    {
        return match ($modelType) {
            'category' => [
                'name' => ['label' => 'Name (English)', 'type' => 'text'],
                'name_ar' => ['label' => 'Name (Arabic)', 'type' => 'text'],
                'slug' => ['label' => 'Slug', 'type' => 'text'],
                'description' => ['label' => 'Description (English)', 'type' => 'textarea'],
                'description_ar' => ['label' => 'Description (Arabic)', 'type' => 'textarea'],
                'parent_id' => ['label' => 'Parent Category', 'type' => 'select', 'empty_label' => 'None (Top Level)'],
                'sort_order' => ['label' => 'Sort Order', 'type' => 'text'],
                'is_active' => ['label' => 'Status', 'type' => 'boolean', 'true_label' => 'Active', 'false_label' => 'Inactive'],
                'low_stock_threshold' => ['label' => 'Low Stock Threshold', 'type' => 'text'],
                'image' => ['label' => 'Image', 'type' => 'image'],
            ],
            'product' => [
                'name' => ['label' => 'Name (English)', 'type' => 'text'],
                'name_ar' => ['label' => 'Name (Arabic)', 'type' => 'text'],
                'slug' => ['label' => 'Slug', 'type' => 'text'],
                'description' => ['label' => 'Description (EN)', 'type' => 'textarea'],
                'description_ar' => ['label' => 'Description (AR)', 'type' => 'textarea'],
                'short_description' => ['label' => 'Short Desc (EN)', 'type' => 'textarea'],
                'short_description_ar' => ['label' => 'Short Desc (AR)', 'type' => 'textarea'],
                'price' => ['label' => 'Price', 'type' => 'text'],
                'compare_price' => ['label' => 'Compare Price', 'type' => 'text'],
                'sku' => ['label' => 'SKU', 'type' => 'text'],
                'stock' => ['label' => 'Stock', 'type' => 'text'],
                'low_stock_threshold' => ['label' => 'Low Stock Threshold', 'type' => 'text'],
                'category_id' => ['label' => 'Category', 'type' => 'select'],
                'is_active' => ['label' => 'Status', 'type' => 'boolean', 'true_label' => 'Active', 'false_label' => 'Inactive'],
                'is_featured' => ['label' => 'Featured', 'type' => 'boolean', 'true_label' => 'Yes', 'false_label' => 'No'],
                'available_sizes' => ['label' => 'Sizes', 'type' => 'array'],
                'available_colors' => ['label' => 'Colors', 'type' => 'array'],
                'variant_stock' => ['label' => 'Variant Stock', 'type' => 'json'],
            ],
            'order' => [
                'status' => ['label' => 'Status', 'type' => 'text'],
                'shipping_address' => ['label' => 'Shipping Address', 'type' => 'textarea'],
                'notes' => ['label' => 'Notes', 'type' => 'textarea'],
            ],
            default => [],
        };
    }

    /**
     * Normalize a value for comparison.
     * Handles null/empty string, boolean, and numeric type differences.
     */
    private function normalizeValue(mixed $value): mixed
    {
        // Treat null and empty string as equivalent
        if ($value === null || $value === '') {
            return null;
        }

        // Handle boolean values (including string representations)
        if ($value === true || $value === false || $value === '1' || $value === '0' || $value === 1 || $value === 0) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        // Handle numeric strings - convert to actual numbers for comparison
        if (is_numeric($value)) {
            // Keep as string if it has leading zeros or is meant to be a string
            return is_string($value) ? $value : $value;
        }

        return $value;
    }

    /**
     * Truncate string with ellipsis.
     */
    private function truncate(string $text, int $length): string
    {
        if (mb_strlen($text) <= $length) {
            return $text;
        }
        return mb_substr($text, 0, $length) . '...';
    }

    /**
     * Get all undo states for a model type (useful for listing).
     */
    public function getAllUndoStates(string $modelType): array
    {
        $states = [];
        $prefix = "undo_{$modelType}_";

        foreach (session()->all() as $key => $value) {
            if (str_starts_with($key, $prefix) && !str_contains($key, 'pending_delete')) {
                $id = str_replace($prefix, '', $key);
                $states[$id] = $value;
            }
        }

        return $states;
    }

    /**
     * Clean up pending image deletes for a model.
     */
    private function cleanupPendingImages(string $modelType, int|string $id): void
    {
        $pendingKey = "undo_pending_delete_{$modelType}_{$id}";
        $pendingImage = session()->get($pendingKey);

        if ($pendingImage) {
            Storage::disk('public')->delete($pendingImage);
            session()->forget($pendingKey);
        }
    }

    /**
     * Get the model type string from a model instance.
     */
    private function getModelType(Model $model): string
    {
        return strtolower(class_basename($model));
    }

    /**
     * Generate session key for a model.
     */
    private function getSessionKey(string $modelType, int|string $id): string
    {
        return "undo_{$modelType}_{$id}";
    }
}
