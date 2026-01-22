import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Badge, Card, CardHeader, CardContent } from '@/Components/ui';
import { Order, OrderActivity } from '@/types/models';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';
import {
    ArrowLeft,
    Package,
    CreditCard,
    Truck,
    FileText,
    Clock,
    User,
    Tag,
    Printer,
    Save,
    CheckCircle,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

interface Props {
    order: Order;
}

const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    paid: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    refunded: 'bg-gray-500/20 text-gray-400',
};

const paymentMethodLabels: Record<string, string> = {
    card: 'Credit/Debit Card',
    paypal: 'PayPal',
    cod: 'Cash on Delivery',
};

const activityIcons: Record<string, React.ReactNode> = {
    created: <CheckCircle className="h-4 w-4 text-green-400" />,
    status_changed: <RefreshCw className="h-4 w-4 text-blue-400" />,
    tracking_updated: <Truck className="h-4 w-4 text-purple-400" />,
    note_added: <FileText className="h-4 w-4 text-gray-400" />,
};

export default function OrderShow({ order }: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;

    // Tracking state
    const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
    const [carrier, setCarrier] = useState(order.carrier || '');
    const [trackingSaving, setTrackingSaving] = useState(false);

    // Admin notes state
    const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
    const [notesSaving, setNotesSaving] = useState(false);

    const handleStatusUpdate = (status: string) => {
        router.patch(`/admin/orders/${order.id}/status`, { status });
    };

    const handleTrackingUpdate = () => {
        setTrackingSaving(true);
        router.patch(
            `/admin/orders/${order.id}/tracking`,
            { tracking_number: trackingNumber, carrier },
            {
                preserveScroll: true,
                onFinish: () => setTrackingSaving(false),
            }
        );
    };

    const handleNotesUpdate = () => {
        setNotesSaving(true);
        router.patch(
            `/admin/orders/${order.id}/admin-notes`,
            { admin_notes: adminNotes },
            {
                preserveScroll: true,
                onFinish: () => setNotesSaving(false),
            }
        );
    };

    const handlePrintInvoice = () => {
        window.open(`/admin/orders/${order.id}/invoice`, '_blank');
    };

    // Calculate discount if coupon applied
    const hasDiscount = order.discount && order.discount > 0;

    return (
        <AdminLayout>
            <Head title={`Order ${order.order_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center text-gray-400 hover:text-white mb-2 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Link>
                        <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handlePrintInvoice}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                        </Button>
                        <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Details - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Package className="h-5 w-5 text-gray-400" />
                                    Order Items
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 py-3 border-b border-gray-700 last:border-0"
                                        >
                                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                                <Package className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{item.product_name}</p>
                                                <p className="text-sm text-gray-400">
                                                    SKU: {item.product_sku} ·{' '}
                                                    {formatPrice(item.price, language)} × {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium text-white">
                                                {formatPrice(item.subtotal, language)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Totals with Discount */}
                                <div className="border-t border-gray-700 mt-4 pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(order.subtotal, language)}</span>
                                    </div>
                                    {hasDiscount && (
                                        <div className="flex justify-between text-green-400">
                                            <span className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                Discount
                                                {order.coupon_code && (
                                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                                        {order.coupon_code}
                                                    </span>
                                                )}
                                            </span>
                                            <span>-{formatPrice(order.discount, language)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-400">
                                        <span>Tax</span>
                                        <span>{formatPrice(order.tax, language)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-700 text-white">
                                        <span>Total</span>
                                        <span>{formatPrice(order.total, language)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-gray-400" />
                                    Payment Information
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                                            Payment Method
                                        </h3>
                                        <p className="font-medium text-white">
                                            {order.payment_method
                                                ? paymentMethodLabels[order.payment_method] ||
                                                  order.payment_method
                                                : 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                                            Payment Status
                                        </h3>
                                        <Badge
                                            className={
                                                paymentStatusColors[order.payment_status] ||
                                                'bg-gray-500/20 text-gray-400'
                                            }
                                        >
                                            {order.payment_status.charAt(0).toUpperCase() +
                                                order.payment_status.slice(1)}
                                        </Badge>
                                    </div>
                                    {order.transaction_id && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">
                                                Transaction ID
                                            </h3>
                                            <p className="font-mono text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                                {order.transaction_id}
                                            </p>
                                        </div>
                                    )}
                                    {order.paid_at && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">
                                                Paid At
                                            </h3>
                                            <p className="text-gray-300">
                                                {formatDateTime(order.paid_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Information */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <User className="h-5 w-5 text-gray-400" />
                                    Customer Information
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                                            Contact
                                        </h3>
                                        <p className="font-medium text-white">{order.customer_name}</p>
                                        <p className="text-gray-300">{order.customer_email}</p>
                                        {order.customer_phone && (
                                            <p className="text-gray-300">{order.customer_phone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                                            Delivery Address
                                        </h3>
                                        <p className="text-gray-300">
                                            {order.shipping_address.area}
                                            <br />
                                            {order.shipping_address.street}
                                            <br />
                                            {order.shipping_address.building}
                                            {order.shipping_address.delivery_notes && (
                                                <>
                                                    <br />
                                                    <span className="text-gray-400 text-sm">
                                                        Note: {order.shipping_address.delivery_notes}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {order.notes && (
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                                            Customer Notes
                                        </h3>
                                        <p className="text-gray-300">{order.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Activity Log */}
                        {order.activities && order.activities.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                        Activity Log
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {order.activities.map((activity: OrderActivity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 pb-4 border-b border-gray-700 last:border-0 last:pb-0"
                                            >
                                                <div className="mt-0.5">
                                                    {activityIcons[activity.action] || (
                                                        <AlertCircle className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-200">
                                                        {activity.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                        <span>
                                                            {formatDateTime(activity.created_at)}
                                                        </span>
                                                        {activity.user && (
                                                            <>
                                                                <span>·</span>
                                                                <span>{activity.user.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {activity.old_value && activity.new_value && (
                                                        <div className="mt-1 text-xs">
                                                            <span className="text-gray-500 line-through">
                                                                {activity.old_value}
                                                            </span>
                                                            <span className="mx-1 text-gray-500">→</span>
                                                            <span className="text-gray-300">
                                                                {activity.new_value}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white">Order Summary</h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Date</span>
                                    <span className="text-gray-200">{formatDateTime(order.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Status</span>
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Payment</span>
                                    <Badge
                                        className={
                                            paymentStatusColors[order.payment_status] ||
                                            'bg-gray-500/20 text-gray-400'
                                        }
                                    >
                                        {order.payment_status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Items</span>
                                    <span className="text-gray-200">{order.items?.length || 0}</span>
                                </div>
                                <div className="flex justify-between font-semibold pt-2 border-t border-gray-700">
                                    <span className="text-white">Total</span>
                                    <span className="text-white">{formatPrice(order.total, language)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Update Status */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white">Update Status</h2>
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
                                                        ? (activeColors[status] ||
                                                              'bg-gray-700 text-white') +
                                                          ' cursor-default'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                                }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tracking Information */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-gray-400" />
                                    Tracking Info
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            Carrier
                                        </label>
                                        <input
                                            type="text"
                                            value={carrier}
                                            onChange={(e) => setCarrier(e.target.value)}
                                            placeholder="e.g., DHL, Aramex"
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            Tracking Number
                                        </label>
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Enter tracking number"
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleTrackingUpdate}
                                        disabled={trackingSaving}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {trackingSaving ? 'Saving...' : 'Update Tracking'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin Notes */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                    Admin Notes
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add internal notes about this order..."
                                        rows={4}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <Button
                                        onClick={handleNotesUpdate}
                                        disabled={notesSaving}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {notesSaving ? 'Saving...' : 'Save Notes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
