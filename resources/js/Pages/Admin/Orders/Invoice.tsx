import { Head } from '@inertiajs/react';
import { Order } from '@/types/models';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { useEffect } from 'react';

interface Props {
    order: Order;
}

export default function Invoice({ order }: Props) {
    // Auto-print when page loads
    useEffect(() => {
        // Small delay to ensure styles are loaded
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const hasDiscount = order.discount && order.discount > 0;

    return (
        <>
            <Head title={`Invoice - ${order.order_number}`} />

            {/* Print-optimized styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                        <p className="text-gray-600 mt-1">#{order.order_number}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-purple-600">HardRock</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Amman, Jordan<br />
                            support@hardrock-co.com<br />
                            +962 79 000 0000
                        </p>
                    </div>
                </div>

                {/* Order Details & Customer Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Bill To
                        </h3>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-gray-600">{order.customer_email}</p>
                        {order.customer_phone && (
                            <p className="text-gray-600">{order.customer_phone}</p>
                        )}
                        <div className="mt-2 text-gray-600 text-sm">
                            {order.shipping_address.area}<br />
                            {order.shipping_address.street}<br />
                            {order.shipping_address.building}
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Invoice Details
                        </h3>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="text-gray-500">Date:</span>{' '}
                                <span className="font-medium">{formatDateTime(order.created_at)}</span>
                            </p>
                            <p>
                                <span className="text-gray-500">Status:</span>{' '}
                                <span className="font-medium capitalize">{order.status}</span>
                            </p>
                            <p>
                                <span className="text-gray-500">Payment:</span>{' '}
                                <span className="font-medium capitalize">{order.payment_status}</span>
                            </p>
                            {order.payment_method && (
                                <p>
                                    <span className="text-gray-500">Method:</span>{' '}
                                    <span className="font-medium capitalize">
                                        {order.payment_method === 'cod'
                                            ? 'Cash on Delivery'
                                            : order.payment_method}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Item
                            </th>
                            <th className="text-center py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                SKU
                            </th>
                            <th className="text-center py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Qty
                            </th>
                            <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Price
                            </th>
                            <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-4 text-gray-900">{item.product_name}</td>
                                <td className="py-4 text-center text-gray-500 text-sm">
                                    {item.product_sku}
                                </td>
                                <td className="py-4 text-center text-gray-900">{item.quantity}</td>
                                <td className="py-4 text-right text-gray-600">
                                    {formatPrice(item.price, 'en')}
                                </td>
                                <td className="py-4 text-right font-medium text-gray-900">
                                    {formatPrice(item.subtotal, 'en')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal, 'en')}</span>
                            </div>
                            {hasDiscount && (
                                <div className="flex justify-between text-green-600">
                                    <span>
                                        Discount
                                        {order.coupon_code && (
                                            <span className="text-xs ml-1">({order.coupon_code})</span>
                                        )}
                                    </span>
                                    <span>-{formatPrice(order.discount, 'en')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span>{formatPrice(order.tax, 'en')}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-200">
                                <span>Total</span>
                                <span>{formatPrice(order.total, 'en')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Order Notes
                        </h3>
                        <p className="text-gray-600 text-sm">{order.notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                    <p>Thank you for your order!</p>
                    <p className="mt-1">
                        For questions, contact us at support@hardrock-co.com
                    </p>
                </div>

                {/* Print Button (hidden in print) */}
                <div className="mt-8 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Print Invoice
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="ml-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}
