<?php

namespace App\Models;

use App\Support\Permission;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar',
        'role',
        'password',
        'email_verified_at',
        'verified_via',
        'permissions',
        'notification_preferences',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'password'                 => 'hashed',
            'permissions'              => 'array',
            'notification_preferences' => 'array',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isEditor(): bool
    {
        return $this->role === 'editor';
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['admin', 'editor'], true);
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /** Check a "section.action" permission. Admins always pass. */
    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if (! $this->isEditor()) {
            return false;
        }

        [$section, $action] = explode('.', $permission, 2);
        $perms = $this->permissions ?? Permission::DEFAULTS;

        return (bool) ($perms[$section][$action] ?? false);
    }

    /** Resolved permissions — editor's stored overrides merged over defaults. */
    public function resolvedPermissions(): array
    {
        if (! $this->isEditor()) {
            return [];
        }

        $stored = $this->permissions ?? [];
        $result = Permission::DEFAULTS;

        foreach ($stored as $section => $actions) {
            foreach ($actions as $action => $value) {
                $result[$section][$action] = (bool) $value;
            }
        }

        return $result;
    }

    /** Resolved notification preferences merged over defaults. */
    public function resolvedNotificationPrefs(): array
    {
        $stored   = $this->notification_preferences ?? [];
        $defaults = Permission::DEFAULT_NOTIFICATION_PREFS;

        foreach ($defaults as $channel => $events) {
            foreach ($events as $event => $default) {
                $defaults[$channel][$event] = (bool) ($stored[$channel][$event] ?? $default);
            }
        }

        return $defaults;
    }

    public function wantsNotification(string $channel, string $event): bool
    {
        return (bool) ($this->resolvedNotificationPrefs()[$channel][$event] ?? false);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Check if user has purchased a specific product
     */
    public function hasPurchased(int $productId): bool
    {
        return $this->orders()
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->where('status', 'delivered')
            ->exists();
    }

    /**
     * Get the duration (in minutes) the remember me cookie should be valid.
     * 30 days = 43200 minutes
     */
    public function getRememberDuration(): int
    {
        return config('auth.remember_me_duration', 43200);
    }
}
