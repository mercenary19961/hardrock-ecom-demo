<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'name_ar',
        'slug',
        'description',
        'description_ar',
        'short_description',
        'short_description_ar',
        'price',
        'compare_price',
        'sku',
        'stock',
        'low_stock_threshold',
        'is_active',
        'is_featured',
        'times_purchased',
        'average_rating',
        'rating_count',
        'view_count',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_price' => 'decimal:2',
            'average_rating' => 'decimal:1',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
            if (empty($product->sku)) {
                $product->sku = strtoupper(Str::random(8));
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock', '>', 0);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%")
              ->orWhere('sku', 'like', "%{$term}%");
        });
    }

    public function isInStock(): bool
    {
        return $this->stock > 0;
    }

    public function hasDiscount(): bool
    {
        return $this->compare_price && $this->compare_price > $this->price;
    }

    public function discountPercentage(): ?int
    {
        if (!$this->hasDiscount()) {
            return null;
        }

        return (int) round((($this->compare_price - $this->price) / $this->compare_price) * 100);
    }

    public function getEffectiveLowStockThreshold(): int
    {
        return $this->low_stock_threshold
            ?? $this->category?->low_stock_threshold
            ?? 10;
    }

    public function isLowStock(): bool
    {
        return $this->stock > 0 && $this->stock <= $this->getEffectiveLowStockThreshold();
    }

    public function getPrimaryImageUrl(): ?string
    {
        $image = $this->primaryImage ?? $this->images->first();

        if (!$image) {
            return null;
        }

        $path = $image->path;

        // Check if path starts with 'products/' - these are in public/images
        if (str_starts_with($path, 'products/')) {
            return asset('images/' . $path);
        }

        // Otherwise use storage path
        return asset('storage/' . $path);
    }
}
