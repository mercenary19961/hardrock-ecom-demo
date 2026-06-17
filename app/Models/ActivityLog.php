<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'model_type',
        'model_id',
        'model_name',
        'action',
        'changes',
        'user_id',
        'reverted_at',
        'reverted_by',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'reverted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function revertedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reverted_by');
    }

    public function isReverted(): bool
    {
        return $this->reverted_at !== null;
    }

    /**
     * Get the related model (polymorphic).
     */
    public function model()
    {
        $modelClass = $this->getModelClass();
        if ($modelClass && class_exists($modelClass)) {
            return $modelClass::find($this->model_id);
        }
        return null;
    }

    /**
     * Get the full model class name.
     */
    protected function getModelClass(): ?string
    {
        $modelMap = [
            'Product' => \App\Models\Product::class,
            'Category' => \App\Models\Category::class,
            'Order' => \App\Models\Order::class,
            'User' => \App\Models\User::class,
            'Coupon' => \App\Models\Coupon::class,
        ];

        return $modelMap[$this->model_type] ?? null;
    }

    /**
     * Get the URL to the related model's edit page.
     */
    public function getModelUrl(): ?string
    {
        $urlMap = [
            'Product' => "/admin/products/{$this->model_id}/edit",
            'Category' => "/admin/categories/{$this->model_id}/edit",
            'Order' => "/admin/orders/{$this->model_id}",
            'User' => "/admin/users/{$this->model_id}",
            'Coupon' => "/admin/coupons/{$this->model_id}/edit",
        ];

        return $urlMap[$this->model_type] ?? null;
    }

    /**
     * Get a human-readable action label.
     */
    public function getActionLabel(): string
    {
        $labels = [
            'created' => 'Created',
            'updated' => 'Updated',
            'deleted' => 'Deleted',
            'restored' => 'Restored',
        ];

        return $labels[$this->action] ?? ucfirst($this->action);
    }

    /**
     * Get the action color for UI display.
     */
    public function getActionColor(): string
    {
        $colors = [
            'created' => 'green',
            'updated' => 'blue',
            'deleted' => 'red',
            'restored' => 'purple',
        ];

        return $colors[$this->action] ?? 'gray';
    }

    /**
     * Scope to get recent activities.
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    /**
     * Scope to filter by model type.
     */
    public function scopeForModel($query, string $modelType)
    {
        return $query->where('model_type', $modelType);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by action.
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}
