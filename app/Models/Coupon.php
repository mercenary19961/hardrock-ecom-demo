<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'name',
        'name_ar',
        'description',
        'description_ar',
        'type',
        'value',
        'min_order_amount',
        'max_discount',
        'usage_limit',
        'usage_count',
        'per_user_limit',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
        'per_user_limit' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Users who have used this coupon
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'coupon_user')
            ->withPivot('usage_count')
            ->withTimestamps();
    }

    /**
     * Scope for active coupons
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for valid coupons (active, within date range, not exhausted)
     */
    public function scopeValid($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) {
                $q->whereNull('usage_limit')
                    ->orWhereColumn('usage_count', '<', 'usage_limit');
            });
    }

    /**
     * Check if coupon is valid for use
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Check if a specific user can use this coupon
     */
    public function canBeUsedBy(?Authenticatable $user): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        if ($user && $this->per_user_limit) {
            $usage = $this->users()
                ->where('user_id', $user->getAuthIdentifier())
                ->first();

            if ($usage && $usage->pivot->usage_count >= $this->per_user_limit) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if coupon meets minimum order amount
     */
    public function meetsMinimumOrder(float $orderTotal): bool
    {
        if (!$this->min_order_amount) {
            return true;
        }

        return $orderTotal >= $this->min_order_amount;
    }

    /**
     * Calculate discount amount for given order total
     */
    public function calculateDiscount(float $orderTotal): float
    {
        if (!$this->meetsMinimumOrder($orderTotal)) {
            return 0;
        }

        if ($this->type === 'percentage') {
            $discount = ($orderTotal * $this->value) / 100;

            // Apply max discount cap if set
            if ($this->max_discount && $discount > $this->max_discount) {
                $discount = $this->max_discount;
            }

            return round($discount, 2);
        }

        // Fixed amount discount
        return min($this->value, $orderTotal);
    }

    /**
     * Increment usage count
     */
    public function incrementUsage(?Authenticatable $user = null): void
    {
        $this->increment('usage_count');

        if ($user) {
            $userId = $user->getAuthIdentifier();
            $existing = $this->users()->where('user_id', $userId)->first();

            if ($existing) {
                $this->users()->updateExistingPivot($userId, [
                    'usage_count' => $existing->pivot->usage_count + 1,
                ]);
            } else {
                $this->users()->attach($userId, ['usage_count' => 1]);
            }
        }
    }

    /**
     * Get validation error message
     */
    public function getValidationError(?Authenticatable $user = null, float $orderTotal = 0): ?string
    {
        if (!$this->is_active) {
            return 'coupon_inactive';
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return 'coupon_not_started';
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return 'coupon_expired';
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return 'coupon_exhausted';
        }

        if ($user && $this->per_user_limit) {
            $usage = $this->users()->where('user_id', $user->getAuthIdentifier())->first();
            if ($usage && $usage->pivot->usage_count >= $this->per_user_limit) {
                return 'coupon_user_limit';
            }
        }

        if ($this->min_order_amount && $orderTotal < $this->min_order_amount) {
            return 'coupon_min_order';
        }

        return null;
    }
}
