import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui';
import { Review, Product } from '@/types/models';
import { formatNumber } from '@/lib/utils';
import { Star, ThumbsUp, CheckCircle, User, Trash2, Edit2 } from 'lucide-react';

interface ReviewSectionProps {
    product: Product;
    reviews: Review[];
    canReview: boolean;
    userReview: Review | null;
    isAuthenticated: boolean;
}

// Star Rating Input Component
function StarRatingInput({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                >
                    <Star
                        className={`h-8 w-8 transition-colors ${
                            (hoverRating || rating) >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

// Star Rating Display Component
function StarRatingDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${sizeClass} ${
                        rating >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                    }`}
                />
            ))}
        </div>
    );
}

// Review Form Component
function ReviewForm({
    productSlug,
    existingReview,
    onCancel,
    language,
}: {
    productSlug: string;
    existingReview?: Review | null;
    onCancel?: () => void;
    language: string;
}) {
    const { t } = useTranslation();
    const isEditing = !!existingReview;
    const isArabic = language === 'ar';

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        rating: existingReview?.rating || 0,
        title: isArabic ? (existingReview?.title_ar || '') : (existingReview?.title || ''),
        title_ar: isArabic ? (existingReview?.title_ar || '') : (existingReview?.title || ''),
        comment: isArabic ? (existingReview?.comment_ar || '') : (existingReview?.comment || ''),
        comment_ar: isArabic ? (existingReview?.comment_ar || '') : (existingReview?.comment || ''),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.rating === 0) return;

        if (isEditing && existingReview) {
            patch(`/review/${existingReview.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    if (onCancel) onCancel();
                },
            });
        } else {
            post(`/product/${productSlug}/review`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? t('shop:reviewsSection.editReview') : t('shop:reviewsSection.writeReview')}
            </h3>

            {/* Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('shop:reviewsSection.rating')} <span className="text-red-500">*</span>
                </label>
                <StarRatingInput rating={data.rating} onChange={(rating) => setData('rating', rating)} />
                {data.rating === 0 && errors.rating && (
                    <p className="mt-1 text-sm text-red-500">{t('shop:reviewsSection.ratingRequired')}</p>
                )}
            </div>

            {/* Title */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('shop:reviewsSection.title')}
                </label>
                <input
                    type="text"
                    value={isArabic ? data.title_ar : data.title}
                    onChange={(e) => {
                        if (isArabic) {
                            setData('title_ar', e.target.value);
                        } else {
                            setData('title', e.target.value);
                        }
                    }}
                    placeholder={t('shop:reviewsSection.titlePlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                    maxLength={255}
                />
            </div>

            {/* Comment */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('shop:reviewsSection.comment')}
                </label>
                <textarea
                    value={isArabic ? data.comment_ar : data.comment}
                    onChange={(e) => {
                        if (isArabic) {
                            setData('comment_ar', e.target.value);
                        } else {
                            setData('comment', e.target.value);
                        }
                    }}
                    placeholder={t('shop:reviewsSection.commentPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent resize-none"
                    maxLength={2000}
                />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing || data.rating === 0}>
                    {isEditing ? t('shop:reviewsSection.update') : t('shop:reviewsSection.submit')}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t('shop:reviewsSection.cancel')}
                    </Button>
                )}
            </div>
        </form>
    );
}

// Single Review Card Component
function ReviewCard({
    review,
    language,
    isOwnReview,
    onEdit,
    onDelete,
}: {
    review: Review;
    language: string;
    isOwnReview: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation();
    const isArabic = language === 'ar';

    const title = isArabic && review.title_ar ? review.title_ar : review.title;
    const comment = isArabic && review.comment_ar ? review.comment_ar : review.comment;

    const handleHelpful = () => {
        router.post(`/review/${review.id}/helpful`, {}, { preserveScroll: true });
    };

    const formattedDate = new Date(review.created_at).toLocaleDateString(
        isArabic ? 'ar-JO' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
    );

    return (
        <div className="border-b border-gray-200 py-6 last:border-0">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-purple/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-brand-purple" />
                    </div>

                    <div>
                        {/* User name and verified badge */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                                {review.user?.name || 'Anonymous'}
                            </span>
                            {review.is_verified_purchase && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="h-3 w-3" />
                                    {t('shop:reviewsSection.verifiedPurchase')}
                                </span>
                            )}
                        </div>

                        {/* Rating and date */}
                        <div className="flex items-center gap-3 mb-2">
                            <StarRatingDisplay rating={review.rating} />
                            <span className="text-sm text-gray-500">{formattedDate}</span>
                        </div>

                        {/* Title */}
                        {title && (
                            <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
                        )}

                        {/* Comment */}
                        {comment && (
                            <p className="text-gray-600 whitespace-pre-line">{comment}</p>
                        )}

                        {/* Helpful button */}
                        <div className="mt-3">
                            <button
                                onClick={handleHelpful}
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-purple transition-colors"
                            >
                                <ThumbsUp className="h-4 w-4" />
                                {t('shop:reviewsSection.helpful')}
                                {review.helpful_count > 0 && (
                                    <span className="text-gray-400">
                                        ({formatNumber(review.helpful_count, language)})
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit/Delete buttons for own review */}
                {isOwnReview && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-gray-400 hover:text-brand-purple transition-colors"
                            title={t('shop:reviewsSection.editReview')}
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={t('shop:reviewsSection.delete')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Rating Summary Component
function RatingSummary({ reviews, averageRating, language }: {
    reviews: Review[];
    averageRating: number;
    language: string;
}) {
    const { t } = useTranslation();
    const isArabic = language === 'ar';

    // Calculate rating distribution
    const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: reviews.filter((r) => r.rating === rating).length,
        percentage: reviews.length > 0
            ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
            : 0,
    }));

    const formattedAverage = new Intl.NumberFormat(isArabic ? 'ar-JO' : 'en-JO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(averageRating);

    return (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Average rating */}
                <div className="text-center md:border-e md:pe-6 md:me-6">
                    <div className="text-4xl font-bold text-gray-900 mb-1">{formattedAverage}</div>
                    <StarRatingDisplay rating={Math.round(averageRating)} size="md" />
                    <p className="text-sm text-gray-500 mt-1">
                        {t('shop:reviewsSection.basedOn', { count: formatNumber(reviews.length, language) as unknown as number })}
                    </p>
                </div>

                {/* Rating bars */}
                <div className="flex-1 space-y-2">
                    {ratingCounts.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-3">{formatNumber(rating, language)}</span>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-500 w-8">
                                {formatNumber(count, language)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Main Review Section Component
export function ReviewSection({
    product,
    reviews,
    canReview,
    userReview,
    isAuthenticated,
}: ReviewSectionProps) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const INITIAL_REVIEWS_COUNT = 3;
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, INITIAL_REVIEWS_COUNT);

    const handleDeleteReview = (review: Review) => {
        if (confirm(t('shop:reviewsSection.deleteConfirm'))) {
            router.delete(`/review/${review.id}`, { preserveScroll: true });
        }
    };

    return (
        <section className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('shop:reviewsSection.title')}
                {reviews.length > 0 && (
                    <span className="text-gray-400 font-normal ms-2">
                        ({formatNumber(reviews.length, language)})
                    </span>
                )}
            </h2>

            {/* Rating Summary */}
            {reviews.length > 0 && (
                <RatingSummary
                    reviews={reviews}
                    averageRating={product.average_rating}
                    language={language}
                />
            )}

            {/* Write Review Button or Form */}
            {isAuthenticated ? (
                <>
                    {canReview && !showForm && !editingReview && (
                        <Button onClick={() => setShowForm(true)} className="mb-6">
                            <Edit2 className="h-4 w-4 me-2" />
                            {t('shop:reviewsSection.writeReview')}
                        </Button>
                    )}

                    {showForm && (
                        <div className="mb-6">
                            <ReviewForm
                                productSlug={product.slug}
                                language={language}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    )}

                    {editingReview && (
                        <div className="mb-6">
                            <ReviewForm
                                productSlug={product.slug}
                                existingReview={editingReview}
                                language={language}
                                onCancel={() => setEditingReview(null)}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-gray-600 mb-4">{t('shop:reviewsSection.loginToReview')}</p>
                    <a href="/login">
                        <Button>
                            {t('common:login')}
                        </Button>
                    </a>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div>
                    {displayedReviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            language={language}
                            isOwnReview={userReview?.id === review.id}
                            onEdit={() => {
                                setEditingReview(review);
                                setShowForm(false);
                            }}
                            onDelete={() => handleDeleteReview(review)}
                        />
                    ))}

                    {/* Show More/Less Button */}
                    {reviews.length > INITIAL_REVIEWS_COUNT && (
                        <div className="mt-6 text-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowAllReviews(!showAllReviews)}
                            >
                                {showAllReviews
                                    ? t('shop:reviewsSection.showLess')
                                    : t('shop:reviewsSection.showMore')}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">{t('shop:reviewsSection.noReviews')}</p>
                    <p className="text-sm text-gray-400">{t('shop:reviewsSection.beFirstToReview')}</p>
                </div>
            )}
        </section>
    );
}
