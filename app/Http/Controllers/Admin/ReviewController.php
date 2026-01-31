<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Review::with(['user:id,name,email,avatar', 'product:id,name,name_ar,slug']);

        // Search by user name/email, product name, or review content
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('user', function ($userQ) use ($searchTerm) {
                    $userQ->where('name', 'like', '%' . $searchTerm . '%')
                          ->orWhere('email', 'like', '%' . $searchTerm . '%');
                })
                ->orWhereHas('product', function ($productQ) use ($searchTerm) {
                    $productQ->where('name', 'like', '%' . $searchTerm . '%')
                             ->orWhere('name_ar', 'like', '%' . $searchTerm . '%');
                })
                ->orWhere('title', 'like', '%' . $searchTerm . '%')
                ->orWhere('comment', 'like', '%' . $searchTerm . '%');
            });
        }

        // Filter by rating
        if ($request->filled('rating') && in_array($request->rating, ['1', '2', '3', '4', '5'])) {
            $query->where('rating', (int) $request->rating);
        }

        // Filter by verified purchase
        if ($request->filled('verified')) {
            $query->where('is_verified_purchase', $request->verified === 'yes');
        }

        // Filter by product
        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->product_id);
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDir = $request->get('dir', 'desc');

        $allowedSortFields = ['created_at', 'rating', 'helpful_count'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');

        // Pagination
        $perPage = in_array($request->per_page, ['8', '16', '32', '64'])
            ? (int) $request->per_page
            : 16;

        $reviews = $query->paginate($perPage);

        // Get rating distribution
        $ratingCounts = Review::selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Get stats
        $stats = [
            'total' => Review::count(),
            'average_rating' => round(Review::avg('rating') ?? 0, 1),
            'verified_count' => Review::where('is_verified_purchase', true)->count(),
            'rating_distribution' => [
                5 => $ratingCounts[5] ?? 0,
                4 => $ratingCounts[4] ?? 0,
                3 => $ratingCounts[3] ?? 0,
                2 => $ratingCounts[2] ?? 0,
                1 => $ratingCounts[1] ?? 0,
            ],
        ];

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'filters' => $request->only(['search', 'rating', 'verified', 'product_id', 'sort', 'dir', 'per_page']),
            'stats' => $stats,
        ]);
    }

    public function show(Review $review): Response
    {
        $review->load([
            'user:id,name,email,avatar,created_at',
            'product:id,name,name_ar,slug,price,compare_price',
            'product.images' => function ($q) {
                $q->where('is_primary', true)->limit(1);
            }
        ]);

        // Get user's other reviews
        $userOtherReviews = Review::where('user_id', $review->user_id)
            ->where('id', '!=', $review->id)
            ->with('product:id,name,name_ar,slug')
            ->latest()
            ->take(5)
            ->get();

        // Get other reviews for the same product
        $productOtherReviews = Review::where('product_id', $review->product_id)
            ->where('id', '!=', $review->id)
            ->with('user:id,name,avatar')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Admin/Reviews/Show', [
            'review' => $review,
            'userOtherReviews' => $userOtherReviews,
            'productOtherReviews' => $productOtherReviews,
        ]);
    }

    public function destroy(Review $review): RedirectResponse
    {
        $productId = $review->product_id;
        $review->delete();

        // Update product rating stats
        $this->updateProductRating($productId);

        return redirect()
            ->route('admin.reviews.index')
            ->with('success', 'Review deleted successfully.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:reviews,id',
        ]);

        $reviews = Review::whereIn('id', $request->ids)->get();
        $productIds = $reviews->pluck('product_id')->unique();

        Review::whereIn('id', $request->ids)->delete();

        // Update product ratings for affected products
        foreach ($productIds as $productId) {
            $this->updateProductRating($productId);
        }

        return back()->with('success', count($request->ids) . ' reviews deleted successfully.');
    }

    /**
     * Update the product's average rating after review changes
     */
    private function updateProductRating(int $productId): void
    {
        $product = Product::find($productId);
        if (!$product) {
            return;
        }

        $stats = Review::where('product_id', $productId)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as count')
            ->first();

        $product->update([
            'average_rating' => round($stats->avg_rating ?? 0, 1),
            'rating_count' => $stats->count ?? 0,
        ]);
    }
}
