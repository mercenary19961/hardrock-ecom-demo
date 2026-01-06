import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Order, PaginatedData } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import { Search, Eye, X, ChevronLeft, ChevronRight, LayoutGrid, List, Package } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks';

interface Props {
    orders: PaginatedData<Order>;
    statusCounts: Record<string, number>;
    filters: { search?: string; status?: string; per_page?: string };
}

const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const perPageOptions = ['5', '10', '15', '25', '50', '100'];

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export default function OrdersIndex({ orders, statusCounts, filters }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    const [search, setSearch] = useState(filters.search || '');
    const [currentStatus, setCurrentStatus] = useState(filters.status || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('ordersViewMode') as 'table' | 'grid') || 'table';
        }
        return 'table';
    });
    const isFirstRender = useRef(true);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    const debouncedSearch = useDebounce(search, 300);

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('ordersViewMode', viewMode);
    }, [viewMode]);

    // SPA-style filter function
    const applyFilters = useCallback((searchVal: string, statusVal: string, perPageVal: string) => {
        router.get(
            '/admin/orders',
            {
                search: searchVal || undefined,
                status: statusVal || undefined,
                per_page: perPageVal !== '15' ? perPageVal : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    }, []);

    // Auto-filter when debounced search changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters(debouncedSearch, currentStatus, perPage);
    }, [debouncedSearch, applyFilters]);

    const handleStatusFilter = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        setCurrentStatus(newStatus);
        applyFilters(search, newStatus, perPage);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, currentStatus, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCurrentStatus('');
        applyFilters('', '', perPage);
    };

    const hasActiveFilters = filters.search || filters.status;

    return (
        <AdminLayout>
            <Head title="Orders" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    {/* View Toggle - hidden on mobile */}
                    <div className="hidden sm:flex border border-gray-300 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            title="Table view"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            title="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => {
                        const totalOrders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
                        const count = status === 'all' ? totalOrders : statusCounts[status];
                        return (
                            <button
                                key={status}
                                onClick={() => handleStatusFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    (filters.status || 'all') === status
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                {count !== undefined && (
                                    <span className="ml-1 opacity-70">({count})</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <Card>
                    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <label htmlFor="orders-search" className="sr-only">Search orders</label>
                            <input
                                id="orders-search"
                                name="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by order #, name, or email..."
                                autoComplete="off"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-900 outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Grid View - shown on mobile always, on desktop when grid selected */}
                <div className={`${viewMode === 'grid' ? 'block' : 'block sm:hidden'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.data.map((order) => (
                            <Link key={order.id} href={`/admin/orders/${order.id}`} preserveScroll>
                                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="p-4">
                                        {/* Order Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium text-gray-900">{order.order_number}</span>
                                            </div>
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </div>

                                        {/* Customer Info */}
                                        <div className="mb-3">
                                            <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                                            <div className="text-xs text-gray-500 truncate">{order.customer_email}</div>
                                        </div>

                                        {/* Order Details */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-500">
                                                {formatDateTime(order.created_at)}
                                            </div>
                                            <div className="font-semibold text-gray-900 tabular-nums">
                                                {formatPrice(order.total, language)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    {orders.data.length === 0 && (
                        <Card>
                            <div className="text-center py-12 text-gray-500">No orders found</div>
                        </Card>
                    )}
                </div>

                {/* Table View - hidden on mobile, shown on desktop when table selected */}
                <Card className={`${viewMode === 'table' ? 'hidden sm:block' : 'hidden'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="hidden lg:table-cell text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.data.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-medium text-gray-900 hover:text-gray-600"
                                            >
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{order.customer_name}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-[150px]">{order.customer_email}</div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 text-gray-500">
                                            {formatDateTime(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 font-medium tabular-nums">
                                            {formatPrice(order.total, language)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/orders/${order.id}`} preserveScroll>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {orders.data.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No orders found</div>
                    )}
                </Card>

                {/* Pagination and Per Page */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {orders.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={orders.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    orders.links[0].url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>

                            {/* Page Numbers */}
                            {orders.links.slice(1, -1).map((link, index) => {
                                const pageNum = index + 1;
                                const currentPage = orders.current_page;
                                const lastPage = orders.last_page;

                                // On small screens: show first, current, last, and neighbors of current
                                const showOnMobile = pageNum === 1 ||
                                    pageNum === lastPage ||
                                    pageNum === currentPage ||
                                    pageNum === currentPage - 1 ||
                                    pageNum === currentPage + 1;

                                // Show ellipsis markers
                                const showLeftEllipsis = pageNum === currentPage - 1 && currentPage > 3;
                                const showRightEllipsis = pageNum === currentPage + 1 && currentPage < lastPage - 2;

                                return (
                                    <span key={index} className={!showOnMobile ? 'hidden sm:inline' : ''}>
                                        {showLeftEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 sm:hidden">...</span>
                                        )}
                                        <Link
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${
                                                link.active
                                                    ? 'bg-gray-900 text-white'
                                                    : link.url
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {pageNum}
                                        </Link>
                                        {showRightEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 sm:hidden">...</span>
                                        )}
                                    </span>
                                );
                            })}

                            {/* Next Button */}
                            <Link
                                href={orders.links[orders.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    orders.links[orders.links.length - 1].url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
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
                            <label htmlFor="orders-per-page" className="text-sm text-gray-500">Show:</label>
                            <select
                                id="orders-per-page"
                                name="per_page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-gray-900 outline-none min-w-[80px]"
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
        </AdminLayout>
    );
}
