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
        // OPTIMIZED: Use path-based check instead of file_exists()
        // file_exists() is extremely slow on remote servers like Railway
        // and was causing 6-7 second load times per category page

        $path = $this->path;

        if (empty($path)) {
            // Fallback to picsum.photos for demo/placeholder images
            $productId = $this->product_id ?? 1;
            $imageNumber = $this->sort_order + 1;
            $seed = ($productId * 10) + $imageNumber;
            return "https://picsum.photos/seed/{$seed}/800/800";
        }

        // Images starting with 'products/' are in public/images (seeded products)
        if (str_starts_with($path, 'products/')) {
            return asset('images/' . $path);
        }

        // Images starting with 'http' are external URLs
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Everything else is in storage (uploaded images)
        return asset('storage/' . $path);
    }
}
