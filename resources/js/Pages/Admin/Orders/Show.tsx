import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Badge, Card, CardHeader, CardContent } from '@/Components/ui';
import { Order } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import { ArrowLeft, Package } from 'lucide-react';

interface Props {
    order: Order;
}

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderShow({ order }: Props) {
    const handleStatusUpdate = (status: string) => {
        router.patch(`/admin/orders/${order.id}/status`, { status });
    };

    return (
        <AdminLayout>
            <Head title={`Order ${order.order_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
                    </div>
                    <Badge className={getStatusColor(order.status)} >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Order Items</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.items?.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Package className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{item.product_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    SKU: {item.product_sku} · {formatPrice(item.price)} × {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium">{formatPrice(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t mt-4 pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tax</span>
                                        <span>{formatPrice(order.tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total</span>
                                        <span>{formatPrice(order.total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Info */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Customer Information</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
                                        <p className="font-medium">{order.customer_name}</p>
                                        <p className="text-gray-600">{order.customer_email}</p>
                                        {order.customer_phone && (
                                            <p className="text-gray-600">{order.customer_phone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
                                        <p className="text-gray-600">
                                            {order.shipping_address.street}<br />
                                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                                            {order.shipping_address.country}
                                        </p>
                                    </div>
                                </div>
                                {order.notes && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Order Notes</h3>
                                        <p className="text-gray-600">{order.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Order Summary</h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date</span>
                                    <span>{formatDateTime(order.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status</span>
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Items</span>
                                    <span>{order.items?.length || 0}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Update Status */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Update Status</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {statuses.map((status) => {
                                        const isActive = order.status === status;
                                        const activeColors: Record<string, string> = {
                                            pending: 'bg-yellow-500 text-white',
                                            processing: 'bg-blue-500 text-white',
                                            shipped: 'bg-purple-500 text-white',
                                            delivered: 'bg-green-500 text-white',
                                            cancelled: 'bg-red-500 text-white',
                                        };

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(status)}
                                                disabled={isActive}
                                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? (activeColors[status] || 'bg-gray-900 text-white') + ' cursor-default'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
