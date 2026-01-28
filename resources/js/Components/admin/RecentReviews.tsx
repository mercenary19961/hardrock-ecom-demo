import { Link } from '@inertiajs/react';
import { Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ReviewItem {
    id: number;
    rating: number;
    title: string | null;
    comment: string | null;
    product_name: string;
    product_slug: string;
    user_name: string;
    created_at: string;
}

interface RecentReviewsProps {
    reviews: ReviewItem[];
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${
                        star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
    if (reviews.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-brand-purple" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reviews</h2>
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No reviews yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-brand-purple" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reviews</h2>
            </div>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <StarRating rating={review.rating} />
                                <span className="text-sm text-gray-500 dark:text-gray-400">{review.user_name}</span>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        {review.title && (
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">{review.title}</p>
                        )}
                        {review.comment && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-1">{review.comment}</p>
                        )}
                        <Link
                            href={`/product/${review.product_slug}`}
                            className="text-xs text-brand-purple hover:text-brand-purple/80 transition-colors"
                        >
                            {review.product_name}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
