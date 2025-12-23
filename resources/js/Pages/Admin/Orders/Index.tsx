import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Order, PaginatedData } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import { Search, Eye } from 'lucide-react';
import { useState } from 'react';

interface Props {
    orders: PaginatedData<Order>;
    statusCounts: Record<string, number>;
    filters: { search?: string; status?: string };
}

const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersIndex({ orders, statusCounts, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/orders', { search, status: filters.status }, { preserveState: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get('/admin/orders', { search, status: status === 'all' ? '' : status }, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Orders" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
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
                            {status !== 'all' && statusCounts[status] !== undefined && (
                                <span className="ml-1 opacity-70">({statusCounts[status] || 0})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by order #, name, or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </form>

                {/* Table */}
                <Card>
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
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {formatDateTime(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/orders/${order.id}`}>
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

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {orders.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-4 py-2 rounded-lg text-sm ${
                                    link.active
                                        ? 'bg-gray-900 text-white'
                                        : link.url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
