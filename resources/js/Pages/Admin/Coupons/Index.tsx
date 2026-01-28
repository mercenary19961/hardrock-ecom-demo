import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Coupon, PaginatedData } from '@/types/models';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Ticket,
    Layers,
    CheckCircle,
    XCircle,
    Clock,
    Percent,
    DollarSign,
    ToggleLeft,
    Settings,
    Power,
    Infinity,
    Check,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks';
import axios from 'axios';

interface Props {
    coupons: PaginatedData<Coupon>;
    filters: { search?: string; status?: string; type?: string; per_page?: string };
    statusCounts: { all: number; active: number; inactive: number; expired: number };
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

const perPageOptions = ['10', '15', '25', '50', '100'];

// Helper to format currency (omit decimals if whole number)
const formatCurrency = (amount: number) => {
    const hasDecimals = amount % 1 !== 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'JOD',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(amount);
};

// Helper to format percentage (omit decimals if whole number)
const formatPercentage = (value: number) => {
    const hasDecimals = value % 1 !== 0;
    return hasDecimals ? value.toFixed(2) : value.toString();
};

// Helper to format date
const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Helper to get coupon status
const getCouponStatus = (coupon: Coupon): 'active' | 'inactive' | 'expired' | 'exhausted' => {
    if (!coupon.is_active) return 'inactive';
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) return 'expired';
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return 'exhausted';
    return 'active';
};

// Helper to get status badge variant
const getStatusBadgeVariant = (status: string): 'success' | 'default' | 'warning' => {
    switch (status) {
        case 'active':
            return 'success';
        case 'inactive':
            return 'default';
        case 'expired':
        case 'exhausted':
            return 'warning';
        default:
            return 'default';
    }
};

export default function CouponsIndex({ coupons, filters, statusCounts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [type, setType] = useState(filters.type || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');
    const isFirstRender = useRef(true);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    const debouncedSearch = useDebounce(search, 300);

    // SPA-style filter function
    const applyFilters = useCallback(
        (searchVal: string, statusVal: string, typeVal: string, perPageVal: string) => {
            router.get(
                '/admin/coupons',
                {
                    search: searchVal || undefined,
                    status: statusVal || undefined,
                    type: typeVal || undefined,
                    per_page: perPageVal !== '15' ? perPageVal : undefined,
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

    // Auto-filter when debounced search changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters(debouncedSearch, status, type, perPage);
    }, [debouncedSearch, applyFilters]);

    const handleStatusFilter = (newStatus: string) => {
        const statusValue = newStatus === 'all' ? '' : newStatus;
        setStatus(statusValue);
        applyFilters(search, statusValue, type, perPage);
    };

    const handleTypeFilter = (newType: string) => {
        const typeValue = newType === 'all' ? '' : newType;
        setType(typeValue);
        applyFilters(search, status, typeValue, perPage);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, status, type, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setType('');
        applyFilters('', '', '', perPage);
    };

    const hasActiveFilters = filters.search || filters.status || filters.type;

    const handleDelete = (coupon: Coupon) => {
        if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
            router.delete(`/admin/coupons/${coupon.id}`);
        }
    };

    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-hide success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
        }
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, [successMessage]);

    const handleToggleActive = async (coupon: Coupon, e?: React.MouseEvent) => {
        // Remove focus ring from the button
        (e?.currentTarget as HTMLElement)?.blur();

        setTogglingIds((prev) => new Set(prev).add(coupon.id));
        try {
            const response = await axios.patch(`/admin/coupons/${coupon.id}/toggle-active`);
            setSuccessMessage(response.data.message);
            router.reload({ only: ['coupons', 'statusCounts'] });
        } catch {
            router.reload({ only: ['coupons', 'statusCounts'] });
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(coupon.id);
                return next;
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Coupons" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Ticket className="h-6 w-6 text-purple-600" />
                        Coupons
                    </h1>
                    <Link href="/admin/coupons/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Add Coupon</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </Link>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleStatusFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            !filters.status
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Layers className="h-4 w-4" />
                        All
                        <span className="opacity-70">({statusCounts.all})</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('active')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            filters.status === 'active'
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Active
                        <span className="opacity-70">({statusCounts.active})</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('inactive')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            filters.status === 'inactive'
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <XCircle className="h-4 w-4" />
                        Inactive
                        <span className="opacity-70">({statusCounts.inactive})</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('expired')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            filters.status === 'expired'
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Clock className="h-4 w-4" />
                        Expired
                        <span className="opacity-70">({statusCounts.expired})</span>
                    </button>
                </div>

                {/* Search and Type Filter */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <label htmlFor="coupons-search" className="sr-only">
                                Search coupons
                            </label>
                            <input
                                id="coupons-search"
                                name="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by code or name..."
                                autoComplete="off"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={type}
                                onChange={(e) => handleTypeFilter(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 text-sm focus:border-gray-900 dark:focus:border-gray-400 outline-none"
                            >
                                <option value="">All Types</option>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={handleClearFilters}>
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                    {coupons.data.map((coupon) => {
                        const couponStatus = getCouponStatus(coupon);
                        return (
                            <Card key={coupon.id} className="dark:bg-gray-800 dark:border-gray-700">
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <code className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                                    {coupon.code}
                                                </code>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {coupon.name}
                                            </p>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(couponStatus)}>
                                            {couponStatus.charAt(0).toUpperCase() + couponStatus.slice(1)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            {coupon.type === 'percentage' ? (
                                                <>
                                                    <Percent className="h-4 w-4" />
                                                    {formatPercentage(coupon.value)}%
                                                </>
                                            ) : (
                                                <>
                                                    <DollarSign className="h-4 w-4" />
                                                    {formatCurrency(coupon.value)}
                                                </>
                                            )}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {coupon.usage_count}
                                            {coupon.usage_limit ? `/${coupon.usage_limit}` : '/'}
                                            {!coupon.usage_limit && <Infinity className="h-3 w-3" />}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {coupon.expires_at ? `Expires: ${formatDate(coupon.expires_at)}` : 'No expiry'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => handleToggleActive(coupon, e)}
                                                title={coupon.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                <Power
                                                    className={`h-4 w-4 ${
                                                        coupon.is_active
                                                            ? 'text-green-500'
                                                            : 'text-gray-400'
                                                    }`}
                                                />
                                            </Button>
                                            <Link href={`/admin/coupons/${coupon.id}/edit`} preserveScroll>
                                                <Button variant="ghost" size="sm" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(coupon)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {coupons.data.length === 0 && (
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No coupons found
                            </div>
                        </Card>
                    )}
                </div>

                {/* Desktop Table Layout */}
                <Card className="hidden md:block dark:bg-gray-800 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Ticket className="h-3.5 w-3.5" />
                                            Code
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Percent className="h-3.5 w-3.5" />
                                            Value
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Usage
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            Dates
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <ToggleLeft className="h-3.5 w-3.5" />
                                            Status
                                        </div>
                                    </th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Settings className="h-3.5 w-3.5" />
                                            Actions
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {coupons.data.map((coupon) => {
                                    const couponStatus = getCouponStatus(coupon);
                                    return (
                                        <tr
                                            key={coupon.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                                    {coupon.code}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                                                {coupon.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                                                    {coupon.type === 'percentage' ? (
                                                        <>
                                                            <span className="font-medium">{formatPercentage(coupon.value)}%</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                off
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-medium">
                                                                {formatCurrency(coupon.value)}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                off
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {coupon.min_order_amount && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Min: {formatCurrency(coupon.min_order_amount)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-gray-900 dark:text-white tabular-nums">
                                                    <span>{coupon.usage_count}</span>
                                                    <span className="text-gray-400">/</span>
                                                    {coupon.usage_limit ? (
                                                        <span>{coupon.usage_limit}</span>
                                                    ) : (
                                                        <Infinity className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div>
                                                    {coupon.starts_at ? (
                                                        <span>From: {formatDate(coupon.starts_at)}</span>
                                                    ) : (
                                                        <span className="text-gray-400">No start</span>
                                                    )}
                                                </div>
                                                <div>
                                                    {coupon.expires_at ? (
                                                        <span>To: {formatDate(coupon.expires_at)}</span>
                                                    ) : (
                                                        <span className="text-gray-400">No expiry</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={getStatusBadgeVariant(couponStatus)}>
                                                    {couponStatus.charAt(0).toUpperCase() + couponStatus.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleToggleActive(coupon, e)}
                                                        title={coupon.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power
                                                            className={`h-4 w-4 ${
                                                                coupon.is_active
                                                                    ? 'text-green-500'
                                                                    : 'text-gray-400'
                                                            }`}
                                                        />
                                                    </Button>
                                                    <Link href={`/admin/coupons/${coupon.id}/edit`} preserveScroll>
                                                        <Button variant="ghost" size="sm" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(coupon)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {coupons.data.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No coupons found
                        </div>
                    )}
                </Card>

                {/* Pagination and Per Page */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {coupons.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={coupons.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    coupons.links[0].url
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>

                            {/* Page Numbers */}
                            {coupons.links.slice(1, -1).map((link, index) => {
                                const pageNum = index + 1;
                                const currentPage = coupons.current_page;
                                const lastPage = coupons.last_page;

                                const showOnMobile =
                                    pageNum === 1 ||
                                    pageNum === lastPage ||
                                    pageNum === currentPage ||
                                    pageNum === currentPage - 1 ||
                                    pageNum === currentPage + 1;

                                const showLeftEllipsis = pageNum === currentPage - 1 && currentPage > 3;
                                const showRightEllipsis =
                                    pageNum === currentPage + 1 && currentPage < lastPage - 2;

                                return (
                                    <span key={index} className={!showOnMobile ? 'hidden sm:inline' : ''}>
                                        {showLeftEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 dark:text-gray-500 sm:hidden">
                                                ...
                                            </span>
                                        )}
                                        <Link
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${
                                                link.active
                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                    : link.url
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {pageNum}
                                        </Link>
                                        {showRightEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 dark:text-gray-500 sm:hidden">
                                                ...
                                            </span>
                                        )}
                                    </span>
                                );
                            })}

                            {/* Next Button */}
                            <Link
                                href={coupons.links[coupons.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    coupons.links[coupons.links.length - 1].url
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}
                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center gap-2">
                            <label htmlFor="coupons-per-page" className="text-sm text-gray-500 dark:text-gray-400">
                                Show:
                            </label>
                            <select
                                id="coupons-per-page"
                                name="per_page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 text-sm focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[80px]"
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

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 pl-4 pr-3 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="font-medium">{successMessage}</span>
                    <button
                        type="button"
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
