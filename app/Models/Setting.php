<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'options',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    /**
     * Get a setting value by key
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember("setting.{$key}", 3600, function () use ($key) {
            return static::where('key', $key)->first();
        });

        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, mixed $value, string $group = 'general', string $type = 'text'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : $value,
                'group' => $group,
                'type' => $type,
            ]
        );

        Cache::forget("setting.{$key}");
        Cache::forget('settings.all');
    }

    /**
     * Get all settings grouped
     */
    public static function getAllGrouped(): array
    {
        return Cache::remember('settings.all', 3600, function () {
            return static::all()
                ->groupBy('group')
                ->map(function ($settings) {
                    return $settings->mapWithKeys(function ($setting) {
                        return [$setting->key => [
                            'value' => self::castValue($setting->value, $setting->type),
                            'type' => $setting->type,
                            'options' => $setting->options,
                        ]];
                    });
                })
                ->toArray();
        });
    }

    /**
     * Cast value based on type
     */
    private static function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'number' => is_numeric($value) ? (float) $value : 0,
            'json' => is_string($value) ? json_decode($value, true) : $value,
            default => $value,
        };
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $settings = static::all();
        foreach ($settings as $setting) {
            Cache::forget("setting.{$setting->key}");
        }
        Cache::forget('settings.all');
    }
}
