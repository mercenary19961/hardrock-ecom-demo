import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Order, PaginatedData } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import {
    Search, Eye, X, ChevronLeft, ChevronRight, LayoutGrid, List, Package,
    Calendar, Download, CheckSquare, Square, CreditCard, Filter
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks';

interface Props {
    orders: PaginatedData<Order>;
    statusCounts: Record<string, number>;
    paymentStatusCounts: Record<string, number>;
    filters: {
        search?: string;
        status?: string;
        payment_status?: string;
        per_page?: string;
        date_from?: string;
        date_to?: string;
        date_preset?: string;
    };
}

const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatuses = ['all', 'pending', 'paid', 'failed', 'refunded'];
const datePresets = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];
const perPageOptions = ['5', '10', '15', '25', '50', '100'];

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

function getPaymentStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export default function OrdersIndex({ orders, statusCounts, paymentStatusCounts, filters }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    const [search, setSearch] = useState(filters.search || '');
    const [currentStatus, setCurrentStatus] = useState(filters.status || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [datePreset, setDatePreset] = useState(filters.date_preset || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('ordersViewMode') as 'table' | 'grid') || 'table';
        }
        return 'table';
    });
    const isFirstRender = useRef(true);

    usePolling({ interval: 30000 });
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        localStorage.setItem('ordersViewMode', viewMode);
    }, [viewMode]);

    const applyFilters = useCallback((
        searchVal: string,
        statusVal: string,
        paymentStatusVal: string,
        perPageVal: string,
        datePresetVal: string,
        dateFromVal: string,
        dateToVal: string
    ) => {
        router.get(
            '/admin/orders',
            {
                search: searchVal || undefined,
                status: statusVal || undefined,
                payment_status: paymentStatusVal || undefined,
                per_page: perPageVal !== '15' ? perPageVal : undefined,
                date_preset: datePresetVal || undefined,
                date_from: dateFromVal || undefined,
                date_to: dateToVal || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    }, []);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters(debouncedSearch, currentStatus, paymentStatus, perPage, datePreset, dateFrom, dateTo);
    }, [debouncedSearch, applyFilters]);

    const handleStatusFilter = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        setCurrentStatus(newStatus);
        applyFilters(search, newStatus, paymentStatus, perPage, datePreset, dateFrom, dateTo);
    };

    const handlePaymentStatusFilter = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        setPaymentStatus(newStatus);
        applyFilters(search, currentStatus, newStatus, perPage, datePreset, dateFrom, dateTo);
    };

    const handleDatePresetChange = (preset: string) => {
        setDatePreset(preset);
        setDateFrom('');
        setDateTo('');
        applyFilters(search, currentStatus, paymentStatus, perPage, preset, '', '');
    };

    const handleDateRangeChange = () => {
        setDatePreset('');
        applyFilters(search, currentStatus, paymentStatus, perPage, '', dateFrom, dateTo);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, currentStatus, paymentStatus, value, datePreset, dateFrom, dateTo);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCurrentStatus('');
        setPaymentStatus('');
        setDatePreset('');
        setDateFrom('');
        setDateTo('');
        applyFilters('', '', '', perPage, '', '', '');
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === orders.data.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.data.map(o => o.id));
        }
    };

    const handleSelectOrder = (orderId: number) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleBulkStatusUpdate = () => {
        if (selectedOrders.length === 0 || !bulkStatus) return;
        router.post('/admin/orders/bulk-status', {
            order_ids: selectedOrders,
            status: bulkStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedOrders([]);
                setBulkStatus('');
            }
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.payment_status) params.append('payment_status', filters.payment_status);
        if (filters.date_preset) params.append('date_preset', filters.date_preset);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        if (selectedOrders.length > 0) {
            selectedOrders.forEach(id => params.append('order_ids[]', id.toString()));
        }
        window.location.href = `/admin/orders/export?${params.toString()}`;
    };

    const hasActiveFilters = filters.search || filters.status || filters.payment_status || filters.date_preset || filters.date_from || filters.date_to;
    const totalOrders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return (
        <AdminLayout>
            <Head title="Orders" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                    <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <Button variant="outline" onClick={handleExport} className="hidden sm:flex">
                            <Download className="h-4 w-4 mr-2" />
                            Export{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}
                        </Button>
                        {/* View Toggle */}
                        <div className="hidden sm:flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 ${viewMode === 'table' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                title="Table view"
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => {
                        const count = status === 'all' ? totalOrders : statusCounts[status];
                        return (
                            <button
                                key={status}
                                onClick={() => handleStatusFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    (filters.status || 'all') === status
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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

                {/* Search and Filters */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4 space-y-4">
                        {/* Search Row */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative flex-1">
                                <label htmlFor="orders-search" className="sr-only">Search orders</label>
                                <input
                                    id="orders-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by order #, name, or email..."
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className={showFilters ? 'bg-gray-100 dark:bg-gray-700' : ''}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={handleClearFilters}>
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {/* Payment Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <CreditCard className="h-4 w-4 inline mr-1" />
                                        Payment Status
                                    </label>
                                    <select
                                        value={paymentStatus || 'all'}
                                        onChange={(e) => handlePaymentStatusFilter(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400"
                                    >
                                        {paymentStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                {status !== 'all' && paymentStatusCounts[status] !== undefined && ` (${paymentStatusCounts[status]})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Preset */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        Date Range
                                    </label>
                                    <select
                                        value={datePreset}
                                        onChange={(e) => handleDatePresetChange(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400"
                                    >
                                        {datePresets.map((preset) => (
                                            <option key={preset.value} value={preset.value}>
                                                {preset.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Date From */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        onBlur={handleDateRangeChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400"
                                    />
                                </div>

                                {/* Custom Date To */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        onBlur={handleDateRangeChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Bulk Actions */}
                {selectedOrders.length > 0 && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                {selectedOrders.length} order(s) selected
                            </span>
                            <div className="flex items-center gap-2 flex-1">
                                <select
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
                                >
                                    <option value="">Update status to...</option>
                                    {statuses.filter(s => s !== 'all').map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    onClick={handleBulkStatusUpdate}
                                    disabled={!bulkStatus}
                                >
                                    Apply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleExport}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Export Selected
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrders([])}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Grid View */}
                <div className={`${viewMode === 'grid' ? 'block' : 'block sm:hidden'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.data.map((order) => (
                            <div key={order.id} className="relative">
                                <button
                                    onClick={() => handleSelectOrder(order.id)}
                                    className="absolute top-3 left-3 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {selectedOrders.includes(order.id) ? (
                                        <CheckSquare className="h-5 w-5 text-blue-600" />
                                    ) : (
                                        <Square className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                                <Link href={`/admin/orders/${order.id}`} preserveScroll>
                                    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                                        <div className="p-4 pl-10">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-white">{order.order_number}</span>
                                                </div>
                                                <Badge className={getStatusColor(order.status)}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <div className="mb-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.customer_email}</div>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge className={getPaymentStatusColor(order.payment_status)}>
                                                    {order.payment_status}
                                                </Badge>
                                                <div className="font-semibold text-gray-900 dark:text-white tabular-nums">
                                                    {formatPrice(order.total, language)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                {formatDateTime(order.created_at)}
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </div>
                        ))}
                    </div>
                    {orders.data.length === 0 && (
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No orders found</div>
                        </Card>
                    )}
                </div>

                {/* Table View */}
                <Card className={`${viewMode === 'table' ? 'hidden sm:block' : 'hidden'} dark:bg-gray-800 dark:border-gray-700`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        <button onClick={handleSelectAll} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                            {selectedOrders.length === orders.data.length && orders.data.length > 0 ? (
                                                <CheckSquare className="h-4 w-4 text-blue-600" />
                                            ) : (
                                                <Square className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="hidden lg:table-cell text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="hidden xl:table-cell text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {orders.data.map((order) => (
                                    <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedOrders.includes(order.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <td className="px-4 py-4">
                                            <button onClick={() => handleSelectOrder(order.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                                {selectedOrders.includes(order.id) ? (
                                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 dark:text-white">{order.customer_name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{order.customer_email}</div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {formatDateTime(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 font-medium tabular-nums text-gray-900 dark:text-white">
                                            {formatPrice(order.total, language)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="hidden xl:table-cell px-6 py-4">
                                            <Badge className={getPaymentStatusColor(order.payment_status)}>
                                                {order.payment_status}
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
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No orders found</div>
                    )}
                </Card>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {orders.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            <Link
                                href={orders.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    orders.links[0].url
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                            {orders.links.slice(1, -1).map((link, index) => {
                                const pageNum = index + 1;
                                const currentPage = orders.current_page;
                                const lastPage = orders.last_page;
                                const showOnMobile = pageNum === 1 || pageNum === lastPage || pageNum === currentPage || pageNum === currentPage - 1 || pageNum === currentPage + 1;
                                return (
                                    <span key={index} className={!showOnMobile ? 'hidden sm:inline' : ''}>
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
                                    </span>
                                );
                            })}
                            <Link
                                href={orders.links[orders.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    orders.links[orders.links.length - 1].url
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
                            <label htmlFor="orders-per-page" className="text-sm text-gray-500 dark:text-gray-400">Show:</label>
                            <select
                                id="orders-per-page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 text-sm focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[80px]"
                            >
                                {perPageOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
