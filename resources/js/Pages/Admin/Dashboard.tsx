import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, Badge } from '@/Components/ui';
import { DashboardStats, Order, Product } from '@/types/models';
import { formatPrice, getStatusColor } from '@/lib/utils';
import {
    Package,
    FolderTree,
    ShoppingCart,
    Users,
    DollarSign,
    Clock,
    AlertTriangle,
    History,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    User,
    PackageX,
    TrendingUp,
    ExternalLink,
} from 'lucide-react';
import { usePolling } from '@/hooks';

interface ActivityLog {
    id: number;
    model_type: string;
    model_id: number;
    model_name: string | null;
    action: 'created' | 'updated' | 'deleted' | 'restored';
    changes: Array<{
        field: string;
        label: string;
        type: string;
        old: string;
        new: string;
    }> | null;
    user_id: number | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    created_at: string;
}

interface Props {
    stats: DashboardStats;
    recentOrders: Order[];
    ordersByStatus: Record<string, number>;
    lowStockProducts: Product[];
    topSellingProducts: Product[];
    recentActivities: ActivityLog[];
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    processing: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    shipped: { color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    delivered: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    cancelled: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function Dashboard({ stats, recentOrders, ordersByStatus, lowStockProducts, topSellingProducts, recentActivities }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    // Helper to format relative time
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    // Get action icon and color
    const getActionStyle = (action: string) => {
        switch (action) {
            case 'created':
                return { icon: Plus, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' };
            case 'updated':
                return { icon: Pencil, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' };
            case 'deleted':
                return { icon: Trash2, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' };
            case 'restored':
                return { icon: RotateCcw, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' };
            default:
                return { icon: History, color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30' };
        }
    };

    // Get model URL
    const getModelUrl = (activity: ActivityLog): string | null => {
        if (activity.action === 'deleted') return null; // Can't link to deleted items
        const urlMap: Record<string, string> = {
            'Product': `/admin/products/${activity.model_id}/edit`,
            'Category': `/admin/categories/${activity.model_id}/edit`,
            'Order': `/admin/orders/${activity.model_id}`,
        };
        return urlMap[activity.model_type] ?? null;
    };

    // Orders by status - compute total for percentage bar
    const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0);

    const statCards = [
        {
            name: 'Total Products',
            value: stats.total_products,
            icon: Package,
            color: 'text-blue-600 bg-blue-100',
        },
        {
            name: 'Categories',
            value: stats.total_categories,
            icon: FolderTree,
            color: 'text-purple-600 bg-purple-100',
        },
        {
            name: 'Total Orders',
            value: stats.total_orders,
            icon: ShoppingCart,
            color: 'text-green-600 bg-green-100',
        },
        {
            name: 'Customers',
            value: stats.total_customers,
            icon: Users,
            color: 'text-orange-600 bg-orange-100',
        },
        {
            name: 'Revenue',
            value: formatPrice(stats.revenue, language),
            icon: DollarSign,
            color: 'text-emerald-600 bg-emerald-100',
        },
        {
            name: 'Pending Orders',
            value: stats.pending_orders,
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-100',
        },
        {
            name: 'Out of Stock',
            value: stats.out_of_stock,
            icon: PackageX,
            color: stats.out_of_stock > 0 ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100',
        },
    ];

    // Low stock severity helper
    const getStockSeverity = (stock: number) => {
        if (stock <= 3) return { className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: `${stock} left` };
        return { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: `${stock} left` };
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                {/* Header with Quick Actions */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/products/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Product
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            All Orders
                        </Link>
                        <Link
                            href="/admin/products"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Package className="h-4 w-4" />
                            All Products
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.name} className="dark:bg-gray-800 dark:border-gray-700">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                                            <p className="text-2xl font-bold mt-1 dark:text-white">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg ${stat.color}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Orders by Status Breakdown */}
                {totalOrders > 0 && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Pipeline</h2>
                            {/* Stacked bar */}
                            <div className="flex rounded-full overflow-hidden h-4 mb-4">
                                {Object.entries(ordersByStatus).map(([status, count]) => {
                                    const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
                                    const pct = (count / totalOrders) * 100;
                                    return (
                                        <div
                                            key={status}
                                            className={`${style.bg} transition-all`}
                                            style={{ width: `${pct}%` }}
                                            title={`${status}: ${count}`}
                                        />
                                    );
                                })}
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {Object.entries(ordersByStatus).map(([status, count]) => {
                                    const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
                                    const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : '0';
                                    return (
                                        <div key={status} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${style.bg}`} />
                                            <span className={`text-sm font-medium capitalize ${style.color}`}>
                                                {status}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {count} ({pct}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold dark:text-white">Recent Orders</h2>
                                <Link
                                    href="/admin/orders"
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1"
                                >
                                    View all
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between py-3 border-b last:border-0 dark:border-gray-700"
                                    >
                                        <div>
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-medium hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                                            >
                                                {order.order_number}
                                            </Link>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {order.customer_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {formatPrice(order.total, language)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentOrders.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No orders yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Stock Products */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    Low Stock Products
                                </h2>
                                <Link
                                    href="/admin/products?status=low_stock"
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1"
                                >
                                    View all
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {lowStockProducts.map((product) => {
                                    const severity = getStockSeverity(product.stock);
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between py-3 border-b last:border-0 dark:border-gray-700"
                                        >
                                            <div>
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    className="font-medium hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                                                >
                                                    {product.name}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    SKU: {product.sku}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severity.className}`}>
                                                {severity.label}
                                            </span>
                                        </div>
                                    );
                                })}
                                {lowStockProducts.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                        All products are well stocked
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Selling Products */}
                {topSellingProducts && topSellingProducts.length > 0 && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                    Top Selling Products
                                </h2>
                                <Link
                                    href="/admin/products"
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1"
                                >
                                    View all
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {topSellingProducts.map((product, index) => {
                                    const maxPurchased = topSellingProducts[0]?.times_purchased || 1;
                                    const barWidth = (product.times_purchased / maxPurchased) * 100;
                                    return (
                                        <div key={product.id} className="flex items-center gap-4 py-2">
                                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6 text-right">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                                                        {product.times_purchased} sold
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-emerald-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${barWidth}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                <History className="h-5 w-5 text-purple-500" />
                                Recent Activity
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {recentActivities && recentActivities.length > 0 ? (
                                recentActivities.map((activity) => {
                                    const actionStyle = getActionStyle(activity.action);
                                    const ActionIcon = actionStyle.icon;
                                    const modelUrl = getModelUrl(activity);
                                    const displayName = activity.model_name || `${activity.model_type} #${activity.model_id}`;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-3 py-3 border-b last:border-0 dark:border-gray-700"
                                        >
                                            {/* Action icon */}
                                            <div className={`p-2 rounded-lg ${actionStyle.color}`}>
                                                <ActionIcon className="h-4 w-4" />
                                            </div>

                                            {/* Activity details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                        {activity.action}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {activity.model_type}:
                                                    </span>
                                                    {modelUrl ? (
                                                        <Link
                                                            href={modelUrl}
                                                            className="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 truncate max-w-[200px]"
                                                        >
                                                            {displayName}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                                                            {displayName}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Changes summary for updates */}
                                                {activity.action === 'updated' && activity.changes && activity.changes.length > 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Changed: {activity.changes.map(c => c.label).join(', ')}
                                                    </p>
                                                )}

                                                {/* User and time */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    {activity.user && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {activity.user.name}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatTimeAgo(activity.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No recent activity
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
