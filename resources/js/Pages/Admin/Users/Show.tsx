import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, CardHeader, CardContent, Badge } from '@/Components/ui';
import {
    User,
    Order,
    Review,
    PaginatedData,
    UserStats,
    ReviewStats,
    TopProduct,
} from '@/types/models';
import { formatPrice } from '@/lib/utils';
import {
    ArrowLeft,
    ShoppingCart,
    CheckCircle,
    DollarSign,
    TrendingUp,
    Trophy,
    Percent,
    UserCircle,
    Mail,
    Phone,
    Shield,
    Calendar,
    Clock,
    ShoppingBag,
    Star,
    Package,
    Pencil,
    KeyRound,
    Send,
    Check,
    ExternalLink,
} from 'lucide-react';

interface Props {
    user: User;
    stats: UserStats;
    orderHistory: PaginatedData<Order>;
    reviews: Review[];
    reviewStats: ReviewStats;
    topProducts: TopProduct[];
    lastOrderDate: string | null;
    cartItemsCount: number;
}

// Helper to format date
const formatDate = (dateString: string, short = false) => {
    if (short) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Order status colors
const getOrderStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'processing':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'shipped':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        case 'delivered':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'cancelled':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

// Payment status colors
const getPaymentStatusColor = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'failed':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        case 'refunded':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

// Star rating display
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );
};

export default function ShowUser({
    user,
    stats,
    orderHistory,
    reviews,
    reviewStats,
    topProducts,
    lastOrderDate,
    cartItemsCount,
}: Props) {
    const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
    const [resetEmailStatus, setResetEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [verifyEmailStatus, setVerifyEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const isAdmin = user.role === 'admin';

    // Filter orders
    const filteredOrders = orderHistory.data.filter((order) => {
        if (orderFilter === 'all') return true;
        return order.status === orderFilter;
    });

    // Quick actions handlers
    const handleSendResetEmail = () => {
        setResetEmailStatus('sending');
        router.post(`/admin/users/${user.id}/send-reset-email`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setResetEmailStatus('sent');
                setTimeout(() => setResetEmailStatus('idle'), 5000);
            },
            onError: () => {
                setResetEmailStatus('idle');
            },
        });
    };

    const handleSendVerificationEmail = () => {
        setVerifyEmailStatus('sending');
        router.post(`/admin/users/${user.id}/send-verification-email`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setVerifyEmailStatus('sent');
                setTimeout(() => setVerifyEmailStatus('idle'), 5000);
            },
            onError: () => {
                setVerifyEmailStatus('idle');
            },
        });
    };

    // Stat cards data
    const statCards = [
        {
            label: 'Total Orders',
            value: stats.total_orders,
            icon: ShoppingCart,
            color: 'text-blue-600',
            format: 'number',
        },
        {
            label: 'Completed',
            value: stats.completed_orders,
            icon: CheckCircle,
            color: 'text-green-600',
            format: 'number',
        },
        {
            label: 'Total Spent',
            value: stats.total_spent,
            icon: DollarSign,
            color: 'text-purple-600',
            format: 'currency',
        },
        {
            label: 'Avg. Order',
            value: stats.average_order,
            icon: TrendingUp,
            color: 'text-indigo-600',
            format: 'currency',
        },
        {
            label: 'Highest Order',
            value: stats.highest_order,
            icon: Trophy,
            color: 'text-amber-600',
            format: 'currency',
        },
        {
            label: 'Total Savings',
            value: stats.total_savings,
            icon: Percent,
            color: 'text-teal-600',
            format: 'currency',
        },
    ];

    return (
        <AdminLayout>
            <Head title={`User: ${user.name}`} />

            {/* Top Action Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Users
                </Link>

                <div className="flex-1 flex items-center justify-center gap-3">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        ) : (
                            <UserCircle className="h-8 w-8 text-gray-400" />
                        )}
                        {user.name}
                    </h1>
                    <Badge
                        variant={isAdmin ? 'default' : 'info'}
                        className="text-xs"
                    >
                        {isAdmin ? (
                            <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                            </span>
                        ) : (
                            'Customer'
                        )}
                    </Badge>
                </div>

                <div className="flex gap-2">
                    <Link href={`/admin/users/${user.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendResetEmail}
                        disabled={resetEmailStatus !== 'idle'}
                    >
                        {resetEmailStatus === 'idle' && (
                            <>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                            </>
                        )}
                        {resetEmailStatus === 'sending' && (
                            <>
                                <Send className="h-4 w-4 mr-2 animate-pulse" />
                                Sending...
                            </>
                        )}
                        {resetEmailStatus === 'sent' && (
                            <>
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                Sent!
                            </>
                        )}
                    </Button>
                    {!user.email_verified_at && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendVerificationEmail}
                            disabled={verifyEmailStatus !== 'idle'}
                        >
                            {verifyEmailStatus === 'idle' && (
                                <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Verify Email
                                </>
                            )}
                            {verifyEmailStatus === 'sending' && (
                                <>
                                    <Send className="h-4 w-4 mr-2 animate-pulse" />
                                    Sending...
                                </>
                            )}
                            {verifyEmailStatus === 'sent' && (
                                <>
                                    <Check className="h-4 w-4 mr-2 text-green-600" />
                                    Sent!
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {stat.label}
                                    </p>
                                    <p className="text-xl font-bold mt-1 dark:text-white">
                                        {stat.format === 'currency'
                                            ? formatPrice(stat.value, 'en')
                                            : stat.value}
                                    </p>
                                </div>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order History */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                                    Order History
                                </h2>
                                <div className="flex gap-1">
                                    {(['all', 'pending', 'delivered', 'cancelled'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setOrderFilter(filter)}
                                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                                orderFilter === filter
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No orders found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                <th className="pb-3 font-medium">Order #</th>
                                                <th className="pb-3 font-medium">Date</th>
                                                <th className="pb-3 font-medium">Status</th>
                                                <th className="pb-3 font-medium">Payment</th>
                                                <th className="pb-3 font-medium text-center">Items</th>
                                                <th className="pb-3 font-medium text-right">Total</th>
                                                <th className="pb-3 font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredOrders.map((order) => (
                                                <tr key={order.id} className="text-sm">
                                                    <td className="py-3">
                                                        <span className="font-mono text-gray-900 dark:text-white">
                                                            {order.order_number}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-gray-600 dark:text-gray-400">
                                                        {formatDate(order.created_at, true)}
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge className={getOrderStatusColor(order.status)}>
                                                            {order.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                                                            {order.payment_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                                                        {order.items?.length || 0}
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                                                        {formatPrice(order.total, 'en')}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Info */}
                            {orderHistory.total > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span>
                                        Showing {orderHistory.from}-{orderHistory.to} of {orderHistory.total} orders
                                    </span>
                                    {orderHistory.last_page > 1 && (
                                        <div className="flex gap-1">
                                            {orderHistory.links.map((link, idx) => {
                                                if (link.label.includes('Previous') || link.label.includes('Next')) {
                                                    return null;
                                                }
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url || '#'}
                                                        className={`px-3 py-1 rounded ${
                                                            link.active
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                        preserveScroll
                                                    >
                                                        {link.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reviews */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Reviews
                                </h2>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {reviewStats.total_reviews} reviews
                                    </span>
                                    {reviewStats.total_reviews > 0 && (
                                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            {reviewStats.average_rating} avg
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No reviews written yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                                    {reviews.slice(0, 10).map((review) => (
                                        <div
                                            key={review.id}
                                            className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        >
                                            {review.product?.images?.[0] ? (
                                                <img
                                                    src={`/images/${review.product.images[0].path}`}
                                                    alt={review.product.name}
                                                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                    <Package className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <Link
                                                            href={`/admin/products/${review.product_id}/edit`}
                                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 line-clamp-1"
                                                        >
                                                            {review.product?.name || 'Unknown Product'}
                                                        </Link>
                                                        <StarRating rating={review.rating} />
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                        {formatDate(review.created_at, true)}
                                                    </span>
                                                </div>
                                                {review.title && (
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                                                        {review.title}
                                                    </p>
                                                )}
                                                {review.comment && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {review.comment}
                                                    </p>
                                                )}
                                                {review.is_verified_purchase && (
                                                    <Badge variant="success" className="mt-2 text-xs">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Verified Purchase
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - 1/3 */}
                <div className="space-y-6">
                    {/* Account Overview */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                <UserCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                Account Overview
                            </h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Avatar & Name */}
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <span className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {user.name}
                                    </h3>
                                    <Badge
                                        variant={isAdmin ? 'default' : 'info'}
                                        className="mt-1 text-xs"
                                    >
                                        {isAdmin ? 'Administrator' : 'Customer'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {user.email}
                                    </span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {user.phone}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Verification Status */}
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Email Verification
                                </label>
                                <div className="mt-2">
                                    {user.email_verified_at ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="success" className="text-xs">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Verified
                                            </Badge>
                                            {user.verified_via && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    via {user.verified_via === 'google' ? 'Google' : 'Email'}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <Badge variant="warning" className="text-xs">
                                            Not Verified
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Member Since
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                                        {formatDate(user.created_at)}
                                    </p>
                                </div>
                                {lastOrderDate && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Last Order
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                                            {formatDate(lastOrderDate, true)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Cart Badge */}
                            {cartItemsCount > 0 && (
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Active Cart
                                        </span>
                                        <Badge variant="info" className="text-xs">
                                            <ShoppingCart className="h-3 w-3 mr-1" />
                                            {cartItemsCount} items
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Most Purchased
                            </h2>
                        </CardHeader>
                        <CardContent>
                            {topProducts.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No purchase history</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topProducts.map((product, index) => (
                                        <Link
                                            key={product.id}
                                            href={`/admin/products/${product.id}/edit`}
                                            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-5">
                                                #{index + 1}
                                            </span>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {product.times_purchased} purchased
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
