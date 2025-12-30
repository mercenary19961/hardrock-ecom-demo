import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { Button, Badge, Card, CardContent } from '@/Components/ui';
import { Order } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

interface Props {
    order: Order;
}

export default function OrderConfirmation({ order }: Props) {
    return (
        <ShopLayout>
            <Head title="Order Confirmed" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Success Message */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-600">
                        Thank you for your order. We've received your order and will process it shortly.
                    </p>
                </div>

                {/* Order Details */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Order Number</p>
                                <p className="text-lg font-semibold">{order.order_number}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Date</p>
                                <p>{formatDateTime(order.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <p>{order.customer_email}</p>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-semibold mb-4">Delivery Address</h3>
                            <p className="text-gray-600">
                                {order.customer_name}<br />
                                {order.customer_phone && <>{order.customer_phone}<br /></>}
                                {order.shipping_address.area}<br />
                                {order.shipping_address.street}<br />
                                {order.shipping_address.building}
                                {order.shipping_address.delivery_notes && (
                                    <>
                                        <br />
                                        <span className="text-gray-500 text-sm">
                                            Note: {order.shipping_address.delivery_notes}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Order Items</h3>
                        <div className="space-y-4">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product_name}</p>
                                        <p className="text-sm text-gray-500">
                                            SKU: {item.product_sku} · Qty: {item.quantity}
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline">
                            Continue Shopping
                        </Button>
                    </Link>
                    <Link href="/orders">
                        <Button>
                            View All Orders
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Demo Notice */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    This is a demo order. No actual products will be shipped.
                </p>
            </div>
        </ShopLayout>
    );
}
