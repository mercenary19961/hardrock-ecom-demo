import { useState } from 'react';
import { Head, Link, router, Deferred } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, Badge } from '@/Components/ui';
import { ActivityDrawer } from '@/Components/admin/ActivityDrawer';
import { DashboardSettings } from '@/Components/admin/DashboardSettings';
import { DateRangeSelector, DateRange } from '@/Components/admin/DateRangeSelector';
import { RevenueChart, ChartDataPoint } from '@/Components/admin/RevenueChart';
import { RecentReviews, ReviewItem } from '@/Components/admin/RecentReviews';
import { ChartSkeleton } from '@/Components/admin/ChartSkeleton';
import { ReviewsSkeleton } from '@/Components/admin/ReviewsSkeleton';
import { useDashboardPreferences, DashboardSectionId } from '@/hooks/useDashboardPreferences';
import { Order, Product } from '@/types/models';
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
    TrendingDown,
    ExternalLink,
    Settings,
    Loader,
    Truck,
    CheckCircle2,
    XCircle,
    GitBranch,
    ClipboardList,
    Ticket,
} from 'lucide-react';
import { usePolling } from '@/hooks';

// Stat with trend indicator
interface StatWithTrend {
    value: number;
    trend: 'up' | 'down' | 'neutral' | null;
    percentage: number | null;
}

interface DashboardStats {
    total_products: StatWithTrend;
    total_categories: StatWithTrend;
    total_orders: StatWithTrend;
    total_customers: StatWithTrend;
    revenue: StatWithTrend;
    pending_orders: StatWithTrend;
    out_of_stock: StatWithTrend;
}

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

interface ActiveCoupon {
    id: number;
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: string;
    usage_count: number;
    usage_limit: number | null;
    expires_at: string | null;
}

interface Props {
    selectedRange: DateRange;
    stats: DashboardStats;
    recentOrders: Order[];
    ordersByStatus: Record<string, number>;
    revenueByStatus: Record<string, number>;
    lowStockProducts: Product[];
    topSellingProducts: Product[];
    recentActivities: ActivityLog[];
    activeCoupons: ActiveCoupon[];
    // Deferred props
    chartData?: ChartDataPoint[];
    recentReviews?: ReviewItem[];
}

const STATUS_STYLES: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
    pending: { color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock },
    processing: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Loader },
    shipped: { color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: Truck },
    delivered: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
    cancelled: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
};

export default function Dashboard({
    selectedRange,
    stats,
    recentOrders,
    ordersByStatus,
    revenueByStatus,
    lowStockProducts,
    topSellingProducts,
    recentActivities,
    activeCoupons,
    chartData = [],
    recentReviews = [],
}: Props) {
    const { i18n } = useTranslation();
    const language = i18n.language;

    // Drawer states
    const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Handle date range change
    const handleRangeChange = (range: DateRange) => {
        router.get('/admin', { range }, { preserveState: true, preserveScroll: true });
    };

    // Dashboard customization
    const {
        sections,
        toggleSectionVisibility,
        moveSectionUp,
        moveSectionDown,
        resetToDefaults,
        isSectionVisible,
    } = useDashboardPreferences();

    // Auto-refresh data every 30 seconds
    // Only poll immediate props - exclude deferred props (chartData, recentReviews)
    // to avoid showing skeletons on every refresh
    usePolling({
        interval: 30000,
        only: [
            'stats',
            'recentOrders',
            'ordersByStatus',
            'revenueByStatus',
            'lowStockProducts',
            'topSellingProducts',
            'recentActivities',
            'activeCoupons',
        ],
    });

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
        if (activity.action === 'deleted') return null;
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
        { name: 'Total Products', stat: stats.total_products, icon: Package, color: 'text-blue-600', isRevenue: false },
        { name: 'Categories', stat: stats.total_categories, icon: FolderTree, color: 'text-purple-600', isRevenue: false },
        { name: 'Total Orders', stat: stats.total_orders, icon: ShoppingCart, color: 'text-green-600', isRevenue: false },
        { name: 'Customers', stat: stats.total_customers, icon: Users, color: 'text-orange-600', isRevenue: false },
        { name: 'Revenue', stat: stats.revenue, icon: DollarSign, color: 'text-emerald-600', isRevenue: true },
        { name: 'Pending Orders', stat: stats.pending_orders, icon: Clock, color: 'text-yellow-600', isRevenue: false },
        { name: 'Out of Stock', stat: stats.out_of_stock, icon: PackageX, color: stats.out_of_stock.value > 0 ? 'text-red-600' : 'text-gray-600', isRevenue: false },
    ];

    // Low stock severity helper
    const getStockSeverity = (stock: number) => {
        if (stock <= 3) return { className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: `${stock} left` };
        return { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: `${stock} left` };
    };

    // Displayed activities (limited to 5 for the widget)
    const displayedActivities = recentActivities.slice(0, 5);

    // Section renderers
    const renderSection = (sectionId: DashboardSectionId) => {
        if (!isSectionVisible(sectionId)) return null;

        switch (sectionId) {
            case 'stats':
                return (
                    <div key="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((card) => {
                            const Icon = card.icon;
                            const displayValue = card.isRevenue
                                ? formatPrice(card.stat.value, language)
                                : card.stat.value;
                            return (
                                <Card key={card.name} className="dark:bg-gray-800 dark:border-gray-700">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{card.name}</p>
                                                <p className="text-2xl font-bold mt-1 dark:text-white">{displayValue}</p>
                                                {/* Trend indicator */}
                                                {card.stat.trend && card.stat.percentage !== null && (
                                                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                                                        card.stat.trend === 'up' ? 'text-green-600' : card.stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                    }`}>
                                                        {card.stat.trend === 'up' ? (
                                                            <TrendingUp className="h-3 w-3" />
                                                        ) : card.stat.trend === 'down' ? (
                                                            <TrendingDown className="h-3 w-3" />
                                                        ) : null}
                                                        <span>{card.stat.percentage}% vs last period</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Icon className={`h-6 w-6 ${card.color}`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {/* Active Coupons card */}
                        <Link href="/admin/coupons">
                            <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Coupons</p>
                                            <p className="text-2xl font-bold mt-1 dark:text-white">{activeCoupons.length}</p>
                                        </div>
                                        <Ticket className="h-6 w-6 text-pink-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                );

            case 'orderPipeline':
                if (totalOrders === 0) return null;
                return (
                    <div key="orderPipeline-combined" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Order Pipeline - 3/4 width */}
                        <Card className="lg:col-span-3 dark:bg-gray-800 dark:border-gray-700">
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
                                    <GitBranch className="h-5 w-5 text-purple-500" />
                                    Order Pipeline
                                </h2>
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
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {Object.entries(ordersByStatus).map(([status, count]) => {
                                        const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
                                        const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : '0';
                                        return (
                                            <div key={status} className="flex items-center gap-2">
                                                {(() => {
                                                    const StatusIcon = style.icon;
                                                    return <StatusIcon className={`h-4 w-4 ${style.color}`} />;
                                                })()}
                                                <span className={`text-sm font-medium capitalize ${style.color}`}>{status}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{count} ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Revenue by status */}
                                {Object.keys(revenueByStatus).length > 0 && (
                                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Revenue by Status</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {Object.entries(revenueByStatus).map(([status, revenue]) => {
                                                const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
                                                return (
                                                    <div key={status} className={`rounded-lg p-3 ${style.bg}`}>
                                                        <p className={`text-xs font-medium capitalize ${style.color}`}>{status}</p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                                                            {formatPrice(revenue, language)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        {/* Recent Orders - 1/4 width */}
                        <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700 flex flex-col">
                            <CardContent className="p-6 flex flex-col flex-1 min-h-0">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                        <ClipboardList className="h-5 w-5 text-blue-500" />
                                        Recent Orders
                                    </h2>
                                    <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
                                        View all <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-64 space-y-3 pr-1">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-gray-700">
                                            <div className="min-w-0 flex-1">
                                                <Link href={`/admin/orders/${order.id}`} className="font-medium text-sm hover:text-gray-600 dark:text-white dark:hover:text-gray-300 truncate block">
                                                    {order.order_number}
                                                </Link>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.customer_name}</p>
                                            </div>
                                            <div className="text-right ml-2 shrink-0">
                                                {(() => {
                                                    const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                                                    const StatusIcon = style.icon;
                                                    return (
                                                        <Badge className={`${getStatusColor(order.status)} inline-flex items-center gap-1 text-xs`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {order.status}
                                                        </Badge>
                                                    );
                                                })()}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatPrice(order.total, language)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No orders yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'revenueChart':
                return (
                    <Deferred key="revenueChart" data="chartData" fallback={<ChartSkeleton />}>
                        <RevenueChart data={chartData} />
                    </Deferred>
                );

            case 'lowStock':
                return (
                    <Card key="lowStock" className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    Low Stock Products
                                </h2>
                                <Link href="/admin/products?status=low_stock" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
                                    View all <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {lowStockProducts.map((product) => {
                                    const severity = getStockSeverity(product.stock);
                                    return (
                                        <div key={product.id} className="flex items-center justify-between py-3 border-b last:border-0 dark:border-gray-700">
                                            <div>
                                                <Link href={`/admin/products/${product.id}/edit`} className="font-medium hover:text-gray-600 dark:text-white dark:hover:text-gray-300">
                                                    {product.name}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severity.className}`}>
                                                {severity.label}
                                            </span>
                                        </div>
                                    );
                                })}
                                {lowStockProducts.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">All products are well stocked</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'topSelling':
                if (!topSellingProducts || topSellingProducts.length === 0) return null;
                return (
                    <Card key="topSelling" className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                    Top Selling Products
                                </h2>
                                <Link href="/admin/products" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
                                    View all <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {topSellingProducts.map((product, index) => {
                                    const maxPurchased = topSellingProducts[0]?.times_purchased || 1;
                                    const barWidth = (product.times_purchased / maxPurchased) * 100;
                                    return (
                                        <div key={product.id} className="flex items-center gap-4 py-2">
                                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6 text-right">{index + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Link href={`/admin/products/${product.id}/edit`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate">
                                                        {product.name}
                                                    </Link>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 shrink-0">{product.times_purchased} sold</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'recentActivity':
                return (
                    <Card key="recentActivity" className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <History className="h-5 w-5 text-purple-500" />
                                    Recent Activity
                                </h2>
                                {recentActivities.length > 5 && (
                                    <button
                                        onClick={() => setActivityDrawerOpen(true)}
                                        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1"
                                    >
                                        View all ({recentActivities.length})
                                        <ExternalLink className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {displayedActivities.length > 0 ? (
                                    displayedActivities.map((activity) => {
                                        const actionStyle = getActionStyle(activity.action);
                                        const ActionIcon = actionStyle.icon;
                                        const modelUrl = getModelUrl(activity);
                                        const displayName = activity.model_name || `${activity.model_type} #${activity.model_id}`;
                                        return (
                                            <div key={activity.id} className="flex items-start gap-3 py-3 border-b last:border-0 dark:border-gray-700">
                                                <div className={`p-2 rounded-lg ${actionStyle.color}`}>
                                                    <ActionIcon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{activity.action}</span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{activity.model_type}:</span>
                                                        {modelUrl ? (
                                                            <Link href={modelUrl} className="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 truncate max-w-[200px]">
                                                                {displayName}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{displayName}</span>
                                                        )}
                                                    </div>
                                                    {activity.action === 'updated' && activity.changes && activity.changes.length > 0 && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Changed: {activity.changes.map(c => c.label).join(', ')}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {activity.user && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {activity.user.name}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(activity.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'recentReviews':
                return (
                    <Deferred key="recentReviews" data="recentReviews" fallback={<ReviewsSkeleton />}>
                        <RecentReviews reviews={recentReviews} />
                    </Deferred>
                );

            default:
                return null;
        }
    };

    // Group sections by layout position
    const orderedSections = sections.filter(s => isSectionVisible(s.id));

    // Sections that should be in a 2-column grid
    const gridPairs: [DashboardSectionId, DashboardSectionId][] = [
        ['lowStock', 'topSelling'],
        ['recentActivity', 'recentReviews'],
    ];

    // Render sections in order, grouping grid pairs
    const renderedSectionIds = new Set<DashboardSectionId>();
    const sectionElements: React.ReactNode[] = [];

    orderedSections.forEach(section => {
        if (renderedSectionIds.has(section.id)) return;

        // Check if this section is part of a grid pair
        const pairIndex = gridPairs.findIndex(pair => pair.includes(section.id));

        if (pairIndex !== -1) {
            const [first, second] = gridPairs[pairIndex];
            const firstVisible = isSectionVisible(first);
            const secondVisible = isSectionVisible(second);

            // Only create grid if both are visible, otherwise render single
            if (firstVisible && secondVisible) {
                sectionElements.push(
                    <div key={`grid-${first}-${second}`} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderSection(first)}
                        {renderSection(second)}
                    </div>
                );
                renderedSectionIds.add(first);
                renderedSectionIds.add(second);
            } else {
                // Render single section
                sectionElements.push(renderSection(section.id));
                renderedSectionIds.add(section.id);
            }
        } else {
            // Regular full-width section
            sectionElements.push(renderSection(section.id));
            renderedSectionIds.add(section.id);
        }
    });

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                {/* Header with Date Range and Quick Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                        <DateRangeSelector selected={selectedRange} onChange={handleRangeChange} />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            title="Customize Dashboard"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
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

                {/* Render all sections */}
                {sectionElements}
            </div>

            {/* Activity Drawer */}
            <ActivityDrawer
                isOpen={activityDrawerOpen}
                onClose={() => setActivityDrawerOpen(false)}
                activities={recentActivities}
            />

            {/* Dashboard Settings Drawer */}
            <DashboardSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                sections={sections}
                onToggleVisibility={toggleSectionVisibility}
                onMoveUp={moveSectionUp}
                onMoveDown={moveSectionDown}
                onReset={resetToDefaults}
            />
        </AdminLayout>
    );
}
