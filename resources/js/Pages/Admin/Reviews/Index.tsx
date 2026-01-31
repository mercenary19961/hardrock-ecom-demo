import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Review, PaginatedData } from '@/types/models';
import {
    Star,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Eye,
    CheckCircle,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Package,
    User,
    Calendar,
    ThumbsUp,
    AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks';

interface Props {
    reviews: PaginatedData<Review>;
    filters: {
        search?: string;
        rating?: string;
        verified?: string;
        product_id?: string;
        sort?: string;
        dir?: string;
        per_page?: string;
    };
    stats: {
        total: number;
        average_rating: number;
        verified_count: number;
        rating_distribution: Record<number, number>;
    };
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const perPageOptions = ['8', '16', '32', '64'];

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Star rating component
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
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

export default function ReviewsIndex({ reviews, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [rating, setRating] = useState(filters.rating || '');
    const [verified, setVerified] = useState(filters.verified || '');
    const [sort, setSort] = useState(filters.sort || 'created_at');
    const [dir, setDir] = useState(filters.dir || 'desc');
    const [perPage, setPerPage] = useState(filters.per_page || '16');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const isFirstRender = useRef(true);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    const debouncedSearch = useDebounce(search, 300);

    // SPA-style filter function
    const applyFilters = useCallback(
        (
            searchVal: string,
            ratingVal: string,
            verifiedVal: string,
            sortVal: string,
            dirVal: string,
            perPageVal: string
        ) => {
            router.get(
                '/admin/reviews',
                {
                    search: searchVal || undefined,
                    rating: ratingVal || undefined,
                    verified: verifiedVal || undefined,
                    sort: sortVal !== 'created_at' ? sortVal : undefined,
                    dir: dirVal !== 'desc' ? dirVal : undefined,
                    per_page: perPageVal !== '16' ? perPageVal : undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        },
        []
    );

    // Apply filters on change
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters(debouncedSearch, rating, verified, sort, dir, perPage);
    }, [debouncedSearch, rating, verified, sort, dir, perPage, applyFilters]);

    // Handle sort toggle
    const handleSort = (field: string) => {
        if (sort === field) {
            setDir(dir === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(field);
            setDir('desc');
        }
    };

    // Get sort icon
    const getSortIcon = (field: string) => {
        if (sort !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
        return dir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
        ) : (
            <ArrowDown className="h-3.5 w-3.5" />
        );
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setSearch('');
        setRating('');
        setVerified('');
        setSort('created_at');
        setDir('desc');
        router.get('/admin/reviews', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Handle per page change
    const handlePerPageChange = (value: string) => {
        setPerPage(value);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedIds.length === reviews.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(reviews.data.map((r) => r.id));
        }
    };

    // Handle select single
    const handleSelectOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} reviews? This action cannot be undone.`)) {
            return;
        }

        router.post(
            '/admin/reviews/bulk-delete',
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    setSuccessMessage(`${selectedIds.length} reviews deleted successfully.`);
                    setTimeout(() => setSuccessMessage(null), 5000);
                },
            }
        );
    };

    // Handle single delete
    const handleDelete = (review: Review) => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        router.delete(`/admin/reviews/${review.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage('Review deleted successfully.');
                setTimeout(() => setSuccessMessage(null), 5000);
            },
        });
    };

    const hasFilters = filters.search || filters.rating || filters.verified;

    return (
        <AdminLayout>
            <Head title="Reviews" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="h-6 w-6 text-yellow-500" />
                        Reviews
                    </h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.total}
                            </p>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.average_rating}
                                </p>
                                <StarRating rating={Math.round(stats.average_rating)} size="md" />
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Verified Purchases</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.verified_count}
                            </p>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Rating Distribution</p>
                            <div className="space-y-1">
                                {[5, 4, 3, 2, 1].map((r) => {
                                    const count = stats.rating_distribution[r] || 0;
                                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                    return (
                                        <div key={r} className="flex items-center gap-2 text-xs">
                                            <span className="w-3 text-gray-500 dark:text-gray-400">{r}</span>
                                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-400 rounded-full"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="w-6 text-right text-gray-500 dark:text-gray-400">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="dark:bg-gray-800 dark:border-gray-700 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reviews, users, products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-gray-900 dark:focus:border-gray-400 outline-none"
                            />
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[140px]"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>

                        {/* Verified Filter */}
                        <select
                            value={verified}
                            onChange={(e) => setVerified(e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[160px]"
                        >
                            <option value="">All Reviews</option>
                            <option value="yes">Verified Only</option>
                            <option value="no">Unverified Only</option>
                        </select>

                        {/* Clear Filters */}
                        {hasFilters && (
                            <Button variant="outline" onClick={handleClearFilters}>
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedIds.length} review{selectedIds.length > 1 ? 's' : ''} selected
                            </span>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Reviews Table */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === reviews.data.length && reviews.data.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                                        />
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5" />
                                            Product
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            Customer
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('rating')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Star className="h-3.5 w-3.5" />
                                            Rating
                                            {getSortIcon('rating')}
                                        </button>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider max-w-xs">
                                        Review
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('helpful_count')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            Helpful
                                            {getSortIcon('helpful_count')}
                                        </button>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('created_at')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                            Date
                                            {getSortIcon('created_at')}
                                        </button>
                                    </th>
                                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reviews.data.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(review.id)}
                                                onChange={() => handleSelectOne(review.id)}
                                                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                href={`/admin/products/${review.product_id}/edit`}
                                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 line-clamp-1 max-w-[200px]"
                                            >
                                                {review.product?.name || 'Unknown Product'}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                                        {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {review.user?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {review.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={review.rating} />
                                                {review.is_verified_purchase && (
                                                    <CheckCircle className="h-4 w-4 text-green-500" title="Verified Purchase" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {review.title && (
                                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {review.title}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {review.comment || <span className="italic text-gray-400">No comment</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {review.helpful_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(review.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link href={`/admin/reviews/${review.id}`} preserveScroll>
                                                    <Button variant="ghost" size="sm" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(review)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No reviews found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {reviews.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={reviews.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                                    reviews.links[0].url
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>

                            {/* Page Numbers - Smart pagination with ellipsis */}
                            {(() => {
                                const currentPage = reviews.current_page;
                                const lastPage = reviews.last_page;
                                const pageLinks = reviews.links.slice(1, -1);

                                const buildPages = (neighborCount: number) => {
                                    const pages: (number | 'ellipsis')[] = [];
                                    for (let i = 1; i <= lastPage; i++) {
                                        const isFirst = i === 1;
                                        const isLast = i === lastPage;
                                        const isCurrent = i === currentPage;
                                        const isNeighbor = Math.abs(i - currentPage) <= neighborCount;

                                        if (isFirst || isLast || isCurrent || isNeighbor) {
                                            const prevShown = pages[pages.length - 1];
                                            if (typeof prevShown === 'number' && i - prevShown > 1) {
                                                pages.push('ellipsis');
                                            }
                                            pages.push(i);
                                        }
                                    }
                                    return pages;
                                };

                                const mobilePages = buildPages(1);
                                const desktopPages = buildPages(2);

                                const renderPage = (item: number | 'ellipsis', index: number, isMobile: boolean) => {
                                    if (item === 'ellipsis') {
                                        return (
                                            <span
                                                key={`ellipsis-${isMobile ? 'm' : 'd'}-${index}`}
                                                className={`text-gray-400 dark:text-gray-500 ${
                                                    isMobile ? 'px-1 py-1.5 text-xs' : 'px-2 py-2 text-sm'
                                                }`}
                                            >
                                                ...
                                            </span>
                                        );
                                    }

                                    const pageNum = item;
                                    const link = pageLinks[pageNum - 1];

                                    return (
                                        <Link
                                            key={`page-${isMobile ? 'm' : 'd'}-${pageNum}`}
                                            href={link?.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`rounded-lg ${
                                                isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                                            } ${
                                                link?.active
                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                    : link?.url
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {pageNum}
                                        </Link>
                                    );
                                };

                                return (
                                    <>
                                        <span className="flex sm:hidden gap-1">
                                            {mobilePages.map((item, index) => renderPage(item, index, true))}
                                        </span>
                                        <span className="hidden sm:flex gap-1 sm:gap-2">
                                            {desktopPages.map((item, index) => renderPage(item, index, false))}
                                        </span>
                                    </>
                                );
                            })()}

                            {/* Next Button */}
                            <Link
                                href={reviews.links[reviews.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                                    reviews.links[reviews.links.length - 1].url
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}
                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <label
                                htmlFor="reviews-per-page"
                                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                            >
                                Show:
                            </label>
                            <select
                                id="reviews-per-page"
                                name="per_page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[60px] sm:min-w-[80px]"
                            >
                                {perPageOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message Toast */}
            {successMessage && (
                <div className="fixed bottom-6 right-6 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg border border-green-200 dark:border-green-800 flex items-center gap-3 animate-in slide-in-from-bottom-5">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="ml-2 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
