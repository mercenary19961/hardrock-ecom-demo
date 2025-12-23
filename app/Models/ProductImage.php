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

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        // Use placeholder images from picsum.photos for demo
        if (str_starts_with($this->path, 'products/placeholder')) {
            $productId = $this->product_id ?? 1;
            $imageNumber = $this->sort_order + 1;
            // Use product_id and sort_order as seed for consistent images
            $seed = ($productId * 10) + $imageNumber;
            return "https://picsum.photos/seed/{$seed}/800/800";
        }

        return asset('storage/' . $this->path);
    }
}
