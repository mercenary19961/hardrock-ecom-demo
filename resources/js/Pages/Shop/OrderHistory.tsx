import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { Badge, Card, CardContent } from '@/Components/ui';
import { Order, PaginatedData } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import { Package, ChevronRight } from 'lucide-react';

interface Props {
    orders: PaginatedData<Order>;
}

export default function OrderHistory({ orders }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;
    return (
        <ShopLayout>
            <Head title="Order History" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>

                {orders.data.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-600 mb-6">
                            You haven't placed any orders yet.
                        </p>
                        <Link
                            href="/"
                            className="text-gray-900 underline hover:no-underline"
                        >
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <Card key={order.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="text-lg font-semibold hover:text-gray-600"
                                            >
                                                {order.order_number}
                                            </Link>
                                            <p className="text-sm text-gray-500">
                                                {formatDateTime(order.created_at)}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(order.status)}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-600">
                                                {order.items?.length || 0} items
                                            </span>
                                            <span className="font-semibold">
                                                {formatPrice(order.total, language)}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="flex items-center text-gray-600 hover:text-gray-900"
                                        >
                                            View Details
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
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
                )}
            </div>
        </ShopLayout>
    );
}
