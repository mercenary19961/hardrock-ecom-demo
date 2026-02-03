import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Select } from '@/Components/ui';
import { Review, PaginatedData } from '@/types/models';
import { useResizableColumns } from '@/hooks';
import { ResizableTh, ResetColumnsButton, SortIcon, StickyScrollWrapper } from '@/Components/admin/ResizableTable';
import {
    Star,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Eye,
    CheckCircle,
    Package,
    User,
    Calendar,
    ThumbsUp,
    MessageSquare,
    Settings2,
    Hash,
    TrendingUp,
    ShieldCheck,
    ShieldX,
    BarChart3,
    ArrowLeft,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

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

const defaultReviews = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 16,
    total: 0,
    from: 0,
    to: 0,
    links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: null, label: '1', active: true },
        { url: null, label: 'Next &raquo;', active: false },
    ],
};

const defaultStats = {
    total: 0,
    average_rating: 0,
    verified_count: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export default function ReviewsIndex(props: Props) {
    // Guard against props being completely undefined during Inertia transitions
    const safeProps = props || {};

    // Safely destructure with defaults to prevent undefined errors
    const reviews = safeProps.reviews ?? defaultReviews;
    // IMPORTANT: PHP returns [] (empty array) when no filters, not {} (empty object)
    // This causes filters?.sort to be Array.prototype.sort instead of undefined!
    const rawFilters = safeProps.filters;
    const filters = (Array.isArray(rawFilters) || !rawFilters) ? {} : rawFilters;
    const stats = safeProps.stats ?? defaultStats;

    // Ensure reviews.data and reviews.links are always arrays
    const reviewsData = Array.isArray(reviews?.data) ? reviews.data : [];
    const reviewsLinks = Array.isArray(reviews?.links) ? reviews.links : defaultReviews.links;

    // Extract filter values safely BEFORE any hooks
    const filterSearch = filters?.search || '';
    const filterRating = filters?.rating || '';
    const filterVerified = filters?.verified || '';
    const filterSort = filters?.sort || 'created_at';
    const filterDir = filters?.dir || 'desc';
    const filterPerPage = filters?.per_page || '16';

    const [search, setSearch] = useState(filterSearch);
    const [rating, setRating] = useState(filterRating);
    const [verified, setVerified] = useState(filterVerified);
    const [sortField, setSortField] = useState(filterSort);
    const [sortDir, setSortDir] = useState(filterDir);
    const [perPage, setPerPage] = useState(filterPerPage);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; review: Review } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    // Resizable columns configuration
    const resizable = useResizableColumns({
        storageKey: 'admin-reviews-table',
        columns: [
            { key: 'checkbox', defaultWidth: 50, minWidth: 40, maxWidth: 60 },
            { key: 'product', defaultWidth: 200, minWidth: 120 },
            { key: 'customer', defaultWidth: 180, minWidth: 120 },
            { key: 'rating', defaultWidth: 120, minWidth: 100 },
            { key: 'review', defaultWidth: 280, minWidth: 150 },
            { key: 'helpful', defaultWidth: 80, minWidth: 60 },
            { key: 'date', defaultWidth: 110, minWidth: 90 },
            { key: 'actions', defaultWidth: 100, minWidth: 80 },
        ],
    });

    // TODO: Re-enable auto-refresh once verified stable
    // import { usePolling } from '@/hooks';
    // usePolling({ interval: 30000 });

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
        applyFilters(debouncedSearch, rating, verified, sortField, sortDir, perPage);
    }, [debouncedSearch, rating, verified, sortField, sortDir, perPage, applyFilters]);

    // Handle sort toggle
    const handleSortToggle = (field: string) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };


    // Handle clear filters
    const handleClearFilters = () => {
        setSearch('');
        setRating('');
        setVerified('');
        setSortField('created_at');
        setSortDir('desc');
        router.get('/admin/reviews', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Handle per page change
    const handlePerPageChange = (value: string) => {
        setPerPage(value);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedIds.length === reviewsData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(reviewsData.map((r) => r.id));
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

    const hasFilters = filters.search || filters.rating || filters.verified ||
        (sortField !== 'created_at' || sortDir !== 'desc');

    // Context menu handlers
    const handleContextMenu = useCallback((e: React.MouseEvent, review: Review) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate position, ensuring menu stays within viewport
        const x = Math.min(e.clientX, window.innerWidth - 160);
        const y = Math.min(e.clientY, window.innerHeight - 120);

        setContextMenu({ x, y, review });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Close context menu on click outside, escape key, or scroll
    useEffect(() => {
        if (!contextMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                closeContextMenu();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeContextMenu();
            }
        };

        const handleScroll = () => {
            closeContextMenu();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [contextMenu, closeContextMenu]);

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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats?.total ?? 0}
                                </p>
                            </div>
                            <Hash className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.average_rating ?? 0}
                                    </p>
                                    <StarRating rating={Math.round(stats?.average_rating ?? 0)} size="md" />
                                </div>
                            </div>
                            <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Verified Purchases</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats?.verified_count ?? 0} <span className="text-sm font-normal text-gray-400">/ {stats?.total ?? 0}</span>
                                </p>
                            </div>
                            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Rating Distribution</p>
                                <div className="space-y-1">
                                    {[5, 4, 3, 2, 1].map((r) => {
                                        const count = stats?.rating_distribution?.[r] ?? 0;
                                        const total = stats?.total ?? 0;
                                        const pct = total > 0 ? (count / total) * 100 : 0;
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
                            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400 ml-4" />
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            {/* Search */}
                            <div className="relative w-full sm:w-1/2">
                                <label htmlFor="reviews-search" className="sr-only">Search reviews</label>
                                <input
                                    id="reviews-search"
                                    name="search"
                                    type="text"
                                    placeholder="Search reviews, users, products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-brand-purple-700 dark:focus:border-brand-purple-400 outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>

                            {/* Filters and Clear Button */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:ml-auto">
                                {/* Clear Filters */}
                                {hasFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-dashed border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear All Filters
                                    </button>
                                )}

                                {/* Rating Filter */}
                                <Select
                                    value={rating}
                                    onChange={setRating}
                                    className="w-full sm:w-36"
                                    placeholder="All Ratings"
                                    options={[
                                        { value: '', label: 'All Ratings', icon: Star },
                                        { value: '5', label: '5 Stars', icon: Star },
                                        { value: '4', label: '4 Stars', icon: Star },
                                        { value: '3', label: '3 Stars', icon: Star },
                                        { value: '2', label: '2 Stars', icon: Star },
                                        { value: '1', label: '1 Star', icon: Star },
                                    ]}
                                />

                                {/* Verified Filter */}
                                <Select
                                    value={verified}
                                    onChange={setVerified}
                                    className="w-full sm:w-44"
                                    placeholder="All Reviews"
                                    options={[
                                        { value: '', label: 'All Reviews', icon: MessageSquare },
                                        { value: 'yes', label: 'Verified Only', icon: ShieldCheck },
                                        { value: 'no', label: 'Unverified Only', icon: ShieldX },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedIds.length} review{selectedIds.length > 1 ? 's' : ''} selected
                            </span>
                            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Reviews Table */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    {/* Header bar with reset button */}
                    <div className="hidden md:flex justify-end items-center px-4 h-10 border-b border-gray-200 dark:border-gray-700">
                        <ResetColumnsButton resizable={resizable} />
                    </div>
                    <StickyScrollWrapper>
                        <table className="w-full table-fixed min-w-[1000px]">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <ResizableTh
                                        columnKey="checkbox"
                                        resizable={resizable}
                                        className="px-4 py-3 text-center"
                                        isResizable={false}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === reviewsData.length && reviewsData.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                                        />
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="product"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('product')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Package className="h-3.5 w-3.5" />
                                            Product
                                            <SortIcon field="product" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="customer"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('customer')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <User className="h-3.5 w-3.5" />
                                            Customer
                                            <SortIcon field="customer" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="rating"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('rating')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Star className="h-3.5 w-3.5" />
                                            Rating
                                            <SortIcon field="rating" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="review"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('title')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Review
                                            <SortIcon field="title" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="helpful"
                                        resizable={resizable}
                                        className="text-left pl-2 pr-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('helpful_count')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            Helpful
                                            <SortIcon field="helpful_count" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="date"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('created_at')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                            Date
                                            <SortIcon field="created_at" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="actions"
                                        resizable={resizable}
                                        className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        isResizable={false}
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Settings2 className="h-3.5 w-3.5" />
                                            Actions
                                        </div>
                                    </ResizableTh>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reviewsData.map((review) => (
                                    <tr
                                        key={review.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-context-menu"
                                        onContextMenu={(e) => handleContextMenu(e, review)}
                                    >
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(review.id)}
                                                onChange={() => handleSelectOne(review.id)}
                                                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 overflow-hidden">
                                            <Link
                                                href={`/admin/products/${review.product_id}/edit`}
                                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                                                title={review.product?.name || 'Unknown Product'}
                                            >
                                                {review.product?.name || 'Unknown Product'}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 overflow-hidden">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                                        {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={review.user?.name}>
                                                        {review.user?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={review.user?.email}>
                                                        {review.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={review.rating} />
                                                {review.is_verified_purchase && (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 overflow-hidden">
                                            {review.title && (
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={review.title}>
                                                    {review.title}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={review.comment || undefined}>
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
                                {reviewsData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No reviews found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </StickyScrollWrapper>
                </Card>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {(reviews?.last_page ?? 1) > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={reviewsLinks[0]?.url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                                    reviewsLinks[0]?.url
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>

                            {/* Page Numbers - Smart pagination with ellipsis */}
                            {(() => {
                                const currentPage = reviews?.current_page ?? 1;
                                const lastPage = reviews?.last_page ?? 1;
                                const pageLinks = reviewsLinks.slice(1, -1);

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
                                href={reviewsLinks[reviewsLinks.length - 1]?.url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                                    reviewsLinks[reviewsLinks.length - 1]?.url
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
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Show:</span>
                            {/* Mobile: small select */}
                            <div className="sm:hidden">
                                <Select
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="w-14"
                                    options={perPageOptions.map(opt => ({ value: opt, label: opt }))}
                                    dropdownPosition="top"
                                    size="sm"
                                />
                            </div>
                            {/* Desktop: default select */}
                            <div className="hidden sm:block">
                                <Select
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="w-20"
                                    options={perPageOptions.map(opt => ({ value: opt, label: opt }))}
                                    dropdownPosition="top"
                                />
                            </div>
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

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    {/* Back */}
                    <button
                        onClick={() => {
                            router.visit('/admin/reviews');
                            closeContextMenu();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Back
                    </button>

                    {/* Show */}
                    <Link
                        href={`/admin/reviews/${contextMenu.review.id}`}
                        preserveScroll
                        onClick={closeContextMenu}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Show
                    </Link>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                    {/* Delete */}
                    <button
                        onClick={() => {
                            handleDelete(contextMenu.review);
                            closeContextMenu();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
