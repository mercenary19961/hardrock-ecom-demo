import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Review } from '@/types/models';
import {
    Star,
    ArrowLeft,
    Trash2,
    CheckCircle,
    Package,
    User,
    Calendar,
    ThumbsUp,
    ExternalLink,
    Mail,
    Clock,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    review: Review;
    userOtherReviews: Review[];
    productOtherReviews: Review[];
}

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Star rating component
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${sizeClass} ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );
}

export default function ReviewShow({ review, userOtherReviews, productOtherReviews }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/admin/reviews/${review.id}`, {
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Review #${review.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/reviews"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Review #{review.id}
                        </h1>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Review'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Review Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Review Card */}
                        <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <StarRating rating={review.rating} size="lg" />
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {review.rating}/5
                                    </span>
                                </div>
                                {review.is_verified_purchase && (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                        Verified Purchase
                                    </Badge>
                                )}
                            </div>

                            {review.title && (
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {review.title}
                                </h2>
                            )}

                            {review.comment ? (
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {review.comment}
                                </p>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 italic">
                                    No comment provided
                                </p>
                            )}

                            <div className="mt-6 pt-4 border-t dark:border-gray-700 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(review.created_at)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4" />
                                    {review.helpful_count} found helpful
                                </div>
                            </div>
                        </Card>

                        {/* Product Info */}
                        <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Package className="h-5 w-5 text-purple-500" />
                                Product
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {review.product?.name || 'Unknown Product'}
                                    </p>
                                    {review.product?.name_ar && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400" dir="rtl">
                                            {review.product.name_ar}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/products/${review.product_id}/edit`}
                                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                    >
                                        <Button variant="outline" size="sm">
                                            Edit Product
                                            <ExternalLink className="h-3.5 w-3.5 ml-2" />
                                        </Button>
                                    </Link>
                                    <a
                                        href={`/shop/product/${review.product?.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="ghost" size="sm">
                                            View in Store
                                            <ExternalLink className="h-3.5 w-3.5 ml-2" />
                                        </Button>
                                    </a>
                                </div>
                            </div>

                            {/* Other Reviews for this Product */}
                            {productOtherReviews.length > 0 && (
                                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Other Reviews for this Product ({productOtherReviews.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {productOtherReviews.map((r) => (
                                            <Link
                                                key={r.id}
                                                href={`/admin/reviews/${r.id}`}
                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <StarRating rating={r.rating} size="sm" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        by {r.user?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {formatShortDate(r.created_at)}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" />
                                Customer
                            </h3>
                            <div className="flex items-center gap-4 mb-4">
                                {review.user?.avatar ? (
                                    <img
                                        src={review.user.avatar}
                                        alt={review.user.name}
                                        className="h-14 w-14 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <span className="text-xl font-medium text-purple-600 dark:text-purple-400">
                                            {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {review.user?.name || 'Unknown User'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {review.user?.email || 'No email'}
                                    </p>
                                </div>
                            </div>
                            <Link href={`/admin/users/${review.user_id}/edit`}>
                                <Button variant="outline" size="sm" className="w-full">
                                    View Customer Profile
                                    <ExternalLink className="h-3.5 w-3.5 ml-2" />
                                </Button>
                            </Link>

                            {/* User's Other Reviews */}
                            {userOtherReviews.length > 0 && (
                                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Other Reviews by this User ({userOtherReviews.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {userOtherReviews.map((r) => (
                                            <Link
                                                key={r.id}
                                                href={`/admin/reviews/${r.id}`}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                        {r.product?.name || 'Unknown'}
                                                    </p>
                                                    <StarRating rating={r.rating} size="sm" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Review Metadata */}
                        <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Details
                            </h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Review ID</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                        #{review.id}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Language</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                                        {review.language || 'en'}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Helpful Votes</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                        {review.helpful_count}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Verified</dt>
                                    <dd className="text-sm font-medium">
                                        {review.is_verified_purchase ? (
                                            <span className="text-green-600 dark:text-green-400">Yes</span>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-400">No</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatShortDate(review.created_at)}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Updated</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatShortDate(review.updated_at)}
                                    </dd>
                                </div>
                            </dl>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
