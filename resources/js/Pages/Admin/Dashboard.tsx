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
    recentActivities: ActivityLog[];
}

export default function Dashboard({ stats, recentOrders, ordersByStatus, lowStockProducts, recentActivities }: Props) {
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
    ];

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold dark:text-white">Recent Orders</h2>
                                <Link
                                    href="/admin/orders"
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    View all
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
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {lowStockProducts.map((product) => (
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
                                        <Badge variant="warning">
                                            {product.stock} left
                                        </Badge>
                                    </div>
                                ))}
                                {lowStockProducts.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                        All products are well stocked
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
