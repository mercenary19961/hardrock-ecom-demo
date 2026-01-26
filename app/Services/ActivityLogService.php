<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Log an activity for a model.
     *
     * @param Model $model The model that was changed
     * @param string $action The action performed (created, updated, deleted, restored)
     * @param array|null $changes Optional array of changes made
     * @param int|null $userId Optional user ID (defaults to authenticated user)
     * @return ActivityLog
     */
    public function log(Model $model, string $action, ?array $changes = null, ?int $userId = null): ActivityLog
    {
        $modelType = class_basename($model);
        $modelId = $model->getKey();
        $modelName = $this->getModelName($model);

        return ActivityLog::create([
            'model_type' => $modelType,
            'model_id' => $modelId,
            'model_name' => $modelName,
            'action' => $action,
            'changes' => $changes,
            'user_id' => $userId ?? Auth::id(),
        ]);
    }

    /**
     * Log a create action.
     */
    public function logCreate(Model $model, ?int $userId = null): ActivityLog
    {
        return $this->log($model, 'created', null, $userId);
    }

    /**
     * Log an update action with changes.
     */
    public function logUpdate(Model $model, array $changes, ?int $userId = null): ActivityLog
    {
        return $this->log($model, 'updated', $changes, $userId);
    }

    /**
     * Log a delete action.
     */
    public function logDelete(Model $model, ?int $userId = null): ActivityLog
    {
        return $this->log($model, 'deleted', null, $userId);
    }

    /**
     * Log a restore action (from undo).
     */
    public function logRestore(Model $model, array $restoredData, ?int $userId = null): ActivityLog
    {
        return $this->log($model, 'restored', $restoredData, $userId);
    }

    /**
     * Get recent activities with user data.
     */
    public function getRecentActivities(int $limit = 10, ?string $modelType = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($modelType) {
            $query->where('model_type', $modelType);
        }

        return $query->limit($limit)->get();
    }

    /**
     * Get activities for a specific model.
     */
    public function getModelActivities(string $modelType, int $modelId, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return ActivityLog::with('user')
            ->where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get activities by user.
     */
    public function getUserActivities(int $userId, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return ActivityLog::with('user')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get paginated activities for the activity log page.
     */
    public function getPaginatedActivities(
        int $perPage = 20,
        ?string $modelType = null,
        ?string $action = null,
        ?int $userId = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($modelType) {
            $query->where('model_type', $modelType);
        }

        if ($action) {
            $query->where('action', $action);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get a display name for the model.
     */
    protected function getModelName(Model $model): ?string
    {
        // Try common name fields
        if (isset($model->name)) {
            return $model->name;
        }

        if (isset($model->title)) {
            return $model->title;
        }

        // For orders, use order number
        if (method_exists($model, 'getAttribute') && $model->order_number) {
            return "Order #{$model->order_number}";
        }

        return null;
    }

    /**
     * Format changes for display in the frontend.
     * Uses the same field config as UndoService for consistency.
     */
    public function formatChangesForDisplay(array $changes): array
    {
        $formatted = [];

        foreach ($changes as $change) {
            $formatted[] = [
                'field' => $change['field'] ?? 'unknown',
                'label' => $change['label'] ?? ucfirst($change['field'] ?? 'unknown'),
                'type' => $change['type'] ?? 'text',
                'old' => $change['old'] ?? '(empty)',
                'new' => $change['new'] ?? '(empty)',
            ];
        }

        return $formatted;
    }

    /**
     * Get activity statistics for dashboard.
     */
    public function getStats(int $days = 7): array
    {
        $startDate = now()->subDays($days);

        return [
            'total' => ActivityLog::where('created_at', '>=', $startDate)->count(),
            'created' => ActivityLog::where('created_at', '>=', $startDate)->where('action', 'created')->count(),
            'updated' => ActivityLog::where('created_at', '>=', $startDate)->where('action', 'updated')->count(),
            'deleted' => ActivityLog::where('created_at', '>=', $startDate)->where('action', 'deleted')->count(),
            'by_model' => ActivityLog::where('created_at', '>=', $startDate)
                ->selectRaw('model_type, count(*) as count')
                ->groupBy('model_type')
                ->pluck('count', 'model_type')
                ->toArray(),
        ];
    }
}
