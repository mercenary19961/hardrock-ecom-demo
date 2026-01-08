<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewHelpfulVote;
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

        // Check if verified purchase (Required to review)
        if (!$user->hasPurchased($product->id)) {
            return back()->withErrors(['review' => 'You must purchase this product to leave a review.']);
        }

        Review::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'title_ar' => $validated['title_ar'],
            'comment' => $validated['comment'],
            'comment_ar' => $validated['comment_ar'],
            'is_verified_purchase' => true,
            'language' => $request->input('language', 'en'),
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
        if (!Auth::check()) {
            return back()->with('error', 'Please login to mark reviews as helpful.');
        }

        $userId = Auth::id();
        $vote = ReviewHelpfulVote::where('review_id', $review->id)
            ->where('user_id', $userId)
            ->first();

        if ($vote) {
            $vote->delete();
            $review->decrement('helpful_count');
        } else {
            ReviewHelpfulVote::create([
                'review_id' => $review->id,
                'user_id' => $userId,
            ]);
            $review->increment('helpful_count');
        }

        return back();
    }
}
