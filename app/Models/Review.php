<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'rating',
        'title',
        'title_ar',
        'comment',
        'comment_ar',
        'is_verified_purchase',
        'helpful_count',
        'language',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_verified_purchase' => 'boolean',
            'helpful_count' => 'integer',
        ];
    }

    protected $appends = ['is_helpful'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function helpfulVotes()
    {
        return $this->hasMany(ReviewHelpfulVote::class);
    }

    public function getIsHelpfulAttribute(): bool
    {
        if (!auth()->check()) {
            return false;
        }

        return $this->helpfulVotes()->where('user_id', auth()->id())->exists();
    }

    /**
     * Scope to get reviews ordered by helpfulness
     */
    public function scopeMostHelpful($query)
    {
        return $query->orderByDesc('helpful_count');
    }

    /**
     * Scope to get reviews ordered by newest first
     */
    public function scopeNewest($query)
    {
        return $query->orderByDesc('created_at');
    }

    /**
     * Scope to filter by rating
     */
    public function scopeWithRating($query, int $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Scope to get verified purchase reviews only
     */
    public function scopeVerifiedOnly($query)
    {
        return $query->where('is_verified_purchase', true);
    }
}
