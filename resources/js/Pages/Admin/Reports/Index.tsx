import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui';
import {
    BarChart3,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Star,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface OrderStatusData {
    count: number;
    revenue: number;
}

interface TopProduct {
    id: number;
    name: string;
    name_ar: string | null;
    sku: string;
    price: number;
    times_purchased: number;
}

interface TopRatedProduct {
    id: number;
    name: string;
    name_ar: string | null;
    average_rating: number;
    rating_count: number;
}

interface TopCustomer {
    id: number;
    name: string;
    email: string;
    orders_count: number;
    total_spent: number;
}

interface CategoryPerformance {
    id: number;
    name: string;
    name_ar: string | null;
    products_count: number;
    total_sold: number;
    avg_rating: number;
}

interface Props {
    range: string;
    revenueOverTime: RevenueDataPoint[];
    revenueSummary: {
        total: number;
        average: number;
        orders: number;
        completed_orders: number;
    };
    ordersByStatus: Record<string, OrderStatusData>;
    topProducts: TopProduct[];
    topRatedProducts: TopRatedProduct[];
    customerStats: {
        total: number;
        new: number;
        with_orders: number;
        repeat_customers: number;
    };
    topCustomers: TopCustomer[];
    categoryPerformance: CategoryPerformance[];
    reviewStats: {
        total: number;
        average_rating: number;
        verified_count: number;
    };
    inventoryStats: {
        total_products: number;
        total_stock: number;
        total_value: number;
        out_of_stock: number;
        low_stock: number;
    };
}

const rangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '365', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
];

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// Simple bar chart component
function SimpleBarChart({ data, maxValue }: { data: RevenueDataPoint[]; maxValue: number }) {
    if (data.length === 0) return null;

    return (
        <div className="flex items-end gap-1 h-32">
            {data.map((point, index) => {
                const height = maxValue > 0 ? (point.revenue / maxValue) * 100 : 0;
                return (
                    <div
                        key={index}
                        className="flex-1 bg-purple-500 dark:bg-purple-400 rounded-t hover:bg-purple-600 dark:hover:bg-purple-300 transition-colors cursor-pointer group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${point.date}: ${formatPrice(point.revenue, 'en')}`}
                    >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {formatPrice(point.revenue, 'en')}
                            <br />
                            {point.orders} orders
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );
}

export default function ReportsIndex({
    range,
    revenueOverTime,
    revenueSummary,
    ordersByStatus,
    topProducts,
    topRatedProducts,
    customerStats,
    topCustomers,
    categoryPerformance,
    reviewStats,
    inventoryStats,
}: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;

    const handleRangeChange = (newRange: string) => {
        router.get('/admin/reports', { range: newRange }, { preserveState: true, preserveScroll: true });
    };

    const maxRevenue = Math.max(...revenueOverTime.map((d) => d.revenue), 1);

    return (
        <AdminLayout>
            <Head title="Reports & Analytics" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                        Reports & Analytics
                    </h1>
                    <select
                        value={range}
                        onChange={(e) => handleRangeChange(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                    >
                        {rangeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Revenue Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatPrice(revenueSummary.total, language)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatPrice(revenueSummary.average, language)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {revenueSummary.orders}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {revenueSummary.completed_orders}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Revenue Chart & Orders by Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Revenue Over Time
                        </h2>
                        {revenueOverTime.length > 0 ? (
                            <>
                                <SimpleBarChart data={revenueOverTime} maxValue={maxRevenue} />
                                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{revenueOverTime[0]?.date}</span>
                                    <span>{revenueOverTime[revenueOverTime.length - 1]?.date}</span>
                                </div>
                            </>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                No revenue data for this period
                            </div>
                        )}
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Orders by Status
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(ordersByStatus).map(([status, data]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                                            {status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {data.count} orders
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatPrice(data.revenue, language)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(ordersByStatus).length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No orders</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Top Products & Top Rated */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Top Selling Products
                            </h2>
                            <Link
                                href="/admin/products"
                                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {topProducts.slice(0, 5).map((product, index) => (
                                <div key={product.id} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/admin/products/${product.id}/edit`}
                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                                        >
                                            {product.name}
                                        </Link>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            SKU: {product.sku}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {product.times_purchased} sold
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatPrice(product.price, language)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sales data</p>
                            )}
                        </div>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Top Rated Products
                            </h2>
                            <Link
                                href="/admin/reviews"
                                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                View reviews
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {topRatedProducts.slice(0, 5).map((product, index) => (
                                <div key={product.id} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/admin/products/${product.id}/edit`}
                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                                        >
                                            {product.name}
                                        </Link>
                                        <StarRating rating={Math.round(product.average_rating ?? 0)} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {(product.average_rating ?? 0).toFixed(1)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {product.rating_count} reviews
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {topRatedProducts.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No rated products</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Customer Stats & Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Customer Stats
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Customers</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{customerStats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">New (This Period)</span>
                                <span className="text-lg font-semibold text-green-600 dark:text-green-400">+{customerStats.new}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">With Orders</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{customerStats.with_orders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Repeat Customers</span>
                                <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">{customerStats.repeat_customers}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Top Customers
                            </h2>
                            <Link
                                href="/admin/users"
                                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {topCustomers.slice(0, 5).map((customer, index) => (
                                <div key={customer.id} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
                                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/admin/users/${customer.id}/edit`}
                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                                        >
                                            {customer.name}
                                        </Link>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {customer.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatPrice(customer.total_spent, language)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {customer.orders_count} orders
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {topCustomers.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No customer data</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Category Performance & Inventory */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Category Performance
                            </h2>
                            <Link
                                href="/admin/categories"
                                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {categoryPerformance.map((category) => (
                                <div key={category.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {category.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {category.products_count} products
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {category.total_sold || 0} sold
                                        </p>
                                        {category.avg_rating > 0 && (
                                            <div className="flex items-center gap-1 justify-end">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {category.avg_rating.toFixed(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {categoryPerformance.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No category data</p>
                            )}
                        </div>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-orange-500" />
                            Inventory Overview
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {inventoryStats.total_products}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Stock</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {inventoryStats.total_stock.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatPrice(inventoryStats.total_value, language)}
                                </p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {inventoryStats.out_of_stock}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Alert</p>
                                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                    {inventoryStats.low_stock} products
                                </p>
                            </div>
                            <Link
                                href="/admin/products?status=low_stock"
                                className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                            >
                                View →
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Review Stats */}
                <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Review Summary
                        </h2>
                        <Link
                            href="/admin/reviews"
                            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                            Manage reviews
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{reviewStats.total}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{reviewStats.average_rating}</p>
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reviewStats.verified_count}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Verified Reviews</p>
                        </div>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
