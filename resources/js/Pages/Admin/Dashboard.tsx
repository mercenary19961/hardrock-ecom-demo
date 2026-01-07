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
} from 'lucide-react';
import { usePolling } from '@/hooks';

interface Props {
    stats: DashboardStats;
    recentOrders: Order[];
    ordersByStatus: Record<string, number>;
    lowStockProducts: Product[];
}

export default function Dashboard({ stats, recentOrders, ordersByStatus, lowStockProducts }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.name}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">{stat.name}</p>
                                            <p className="text-2xl font-bold mt-1">{stat.value}</p>
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
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Recent Orders</h2>
                                <Link
                                    href="/admin/orders"
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between py-3 border-b last:border-0"
                                    >
                                        <div>
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-medium hover:text-gray-600"
                                            >
                                                {order.order_number}
                                            </Link>
                                            <p className="text-sm text-gray-500">
                                                {order.customer_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formatPrice(order.total, language)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentOrders.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">No orders yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Stock Products */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    Low Stock Products
                                </h2>
                                <Link
                                    href="/admin/products?status=low_stock"
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {lowStockProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between py-3 border-b last:border-0"
                                    >
                                        <div>
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="font-medium hover:text-gray-600"
                                            >
                                                {product.name}
                                            </Link>
                                            <p className="text-sm text-gray-500">
                                                SKU: {product.sku}
                                            </p>
                                        </div>
                                        <Badge variant="warning">
                                            {product.stock} left
                                        </Badge>
                                    </div>
                                ))}
                                {lowStockProducts.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">
                                        All products are well stocked
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
