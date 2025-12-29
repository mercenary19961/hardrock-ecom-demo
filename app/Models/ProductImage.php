<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'path',
        'alt_text',
        'sort_order',
        'is_primary',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function ($image) {
            if ($image->is_primary) {
                // Unset other primaries for the same product
                ProductImage::where('product_id', $image->product_id)
                    ->where('id', '!=', $image->id ?? 0)
                    ->update(['is_primary' => false]);
            }
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        $storagePath = storage_path('app/public/' . $this->path);

        // If file exists in storage, return the actual URL
        if (file_exists($storagePath)) {
            return asset('storage/' . $this->path);
        }

        // Fallback to picsum.photos for demo/placeholder images
        $productId = $this->product_id ?? 1;
        $imageNumber = $this->sort_order + 1;
        $seed = ($productId * 10) + $imageNumber;
        return "https://picsum.photos/seed/{$seed}/800/800";
    }
}
