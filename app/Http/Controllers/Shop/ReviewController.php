<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:2000',
            'comment_ar' => 'nullable|string|max:2000',
        ]);

        $user = Auth::user();

        // Check if user already reviewed this product
        $existingReview = Review::where('product_id', $product->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingReview) {
            return back()->withErrors(['review' => 'You have already reviewed this product.']);
        }

        // Check if verified purchase
        $isVerifiedPurchase = $user->hasPurchased($product->id);

        Review::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'title_ar' => $validated['title_ar'],
            'comment' => $validated['comment'],
            'comment_ar' => $validated['comment_ar'],
            'is_verified_purchase' => $isVerifiedPurchase,
        ]);

        // Update product rating stats
        $product->updateRatingStats();

        return back()->with('success', 'Review submitted successfully!');
    }

    public function update(Request $request, Review $review): RedirectResponse
    {
        // Ensure user owns this review
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:2000',
            'comment_ar' => 'nullable|string|max:2000',
        ]);

        $review->update($validated);

        // Update product rating stats
        $review->product->updateRatingStats();

        return back()->with('success', 'Review updated successfully!');
    }

    public function destroy(Review $review): RedirectResponse
    {
        // Ensure user owns this review or is admin
        if ($review->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403);
        }

        $product = $review->product;
        $review->delete();

        // Update product rating stats
        $product->updateRatingStats();

        return back()->with('success', 'Review deleted successfully!');
    }

    public function helpful(Review $review): RedirectResponse
    {
        $review->increment('helpful_count');

        return back();
    }
}
