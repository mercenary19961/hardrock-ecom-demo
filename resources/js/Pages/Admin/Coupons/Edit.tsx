import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent } from '@/Components/ui';
import { Coupon } from '@/types/models';
import {
    ArrowLeft,
    Type,
    FileText,
    ToggleLeft,
    Pencil,
    Settings,
    Ticket,
    Percent,
    DollarSign,
    Calendar,
    Users,
    ShoppingCart,
    BarChart3,
    TrendingUp,
    Package,
} from 'lucide-react';

interface Props {
    coupon: Coupon;
    stats: {
        usage_count: number;
        orders_count: number;
        total_discount: number;
    };
}

// Helper to format currency (omit decimals if whole number)
const formatCurrency = (amount: number) => {
    const hasDecimals = amount % 1 !== 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'JOD',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(amount);
};

// Helper to format numeric value (strip trailing zeros)
const formatNumericValue = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num % 1 !== 0 ? num.toString() : Math.floor(num).toString();
};

// Helper to format datetime for input
const formatDateTimeForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
};

export default function EditCoupon({ coupon, stats }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        code: coupon.code,
        name: coupon.name,
        name_ar: coupon.name_ar || '',
        description: coupon.description || '',
        description_ar: coupon.description_ar || '',
        type: coupon.type,
        value: formatNumericValue(coupon.value),
        min_order_amount: formatNumericValue(coupon.min_order_amount),
        max_discount: formatNumericValue(coupon.max_discount),
        usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
        per_user_limit: coupon.per_user_limit ? String(coupon.per_user_limit) : '',
        starts_at: formatDateTimeForInput(coupon.starts_at),
        expires_at: formatDateTimeForInput(coupon.expires_at),
        is_active: coupon.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/coupons/${coupon.id}`);
    };

    return (
        <AdminLayout>
            <Head title={`Edit Coupon: ${coupon.code}`} />

            {/* Top Action Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/admin/coupons"
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Coupons
                </Link>
                <div className="flex gap-3 ml-auto">
                    <Button type="submit" form="coupon-edit-form" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link href="/admin/coupons">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Times Used</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                    {stats.usage_count}
                                    {coupon.usage_limit && (
                                        <span className="text-sm font-normal text-gray-400">
                                            {' '}
                                            / {coupon.usage_limit}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                    {stats.orders_count}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Discount Given</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                    {formatCurrency(stats.total_discount)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <form id="coupon-edit-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left Card - Coupon Information */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                <Pencil className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                Coupon Information
                            </h2>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Coupon Code */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <Ticket className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    Coupon Code
                                </label>
                                <Input
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    error={errors.code}
                                    placeholder="e.g., SUMMER20"
                                    className="font-mono uppercase"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    The code customers will enter at checkout. Must be unique.
                                </p>
                            </div>

                            {/* Coupon Name */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <Type className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    Coupon Name
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="English"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                        placeholder="e.g., Summer Sale"
                                        required
                                    />
                                    <Input
                                        label="Arabic"
                                        value={data.name_ar}
                                        onChange={(e) => setData('name_ar', e.target.value)}
                                        error={errors.name_ar}
                                        dir="rtl"
                                        placeholder="تخفيضات الصيف"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    Description (Optional)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Textarea
                                        label="English"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        error={errors.description}
                                        rows={3}
                                        placeholder="Coupon description"
                                    />
                                    <Textarea
                                        label="Arabic"
                                        value={data.description_ar}
                                        onChange={(e) => setData('description_ar', e.target.value)}
                                        error={errors.description_ar}
                                        rows={3}
                                        dir="rtl"
                                        placeholder="وصف الكوبون"
                                    />
                                </div>
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <Percent className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    Discount Type
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'percentage')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            data.type === 'percentage'
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Percent className="h-4 w-4" />
                                        Percentage
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'fixed')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            data.type === 'fixed'
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        Fixed Amount
                                    </button>
                                </div>
                            </div>

                            {/* Discount Value */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    {data.type === 'percentage' ? (
                                        <Percent className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                        <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    )}
                                    Discount Value
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={data.value}
                                        onChange={(e) => setData('value', e.target.value)}
                                        error={errors.value}
                                        placeholder={data.type === 'percentage' ? 'e.g., 20' : 'e.g., 5'}
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                                        {data.type === 'percentage' ? '%' : 'JOD'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Card - Settings & Limits */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                Settings & Limits
                            </h2>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Min Order Amount */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <ShoppingCart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    Minimum Order Amount (Optional)
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={data.min_order_amount}
                                        onChange={(e) => setData('min_order_amount', e.target.value)}
                                        error={errors.min_order_amount}
                                        placeholder="e.g., 50"
                                        min="0"
                                        step="0.01"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                                        JOD
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Coupon only applies if cart subtotal is at least this amount.
                                </p>
                            </div>

                            {/* Max Discount (only for percentage) */}
                            {data.type === 'percentage' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Maximum Discount (Optional)
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={data.max_discount}
                                            onChange={(e) => setData('max_discount', e.target.value)}
                                            error={errors.max_discount}
                                            placeholder="e.g., 30"
                                            min="0"
                                            step="0.01"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                                            JOD
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Cap the maximum discount amount for percentage coupons.
                                    </p>
                                </div>
                            )}

                            {/* Usage Limits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Total Usage Limit
                                    </label>
                                    <Input
                                        type="number"
                                        value={data.usage_limit}
                                        onChange={(e) => setData('usage_limit', e.target.value)}
                                        error={errors.usage_limit}
                                        placeholder="Unlimited"
                                        min="1"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Currently used: {coupon.usage_count} times
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Per User Limit
                                    </label>
                                    <Input
                                        type="number"
                                        value={data.per_user_limit}
                                        onChange={(e) => setData('per_user_limit', e.target.value)}
                                        error={errors.per_user_limit}
                                        placeholder="Unlimited"
                                        min="1"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Max uses per customer.
                                    </p>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Start Date
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        error={errors.starts_at}
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        When the coupon becomes valid.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Expiry Date
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={data.expires_at}
                                        onChange={(e) => setData('expires_at', e.target.value)}
                                        error={errors.expires_at}
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        When the coupon expires.
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <ToggleLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    Status
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('is_active', true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            data.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-2 ring-green-500'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                data.is_active ? 'bg-green-500' : 'bg-gray-400'
                                            }`}
                                        />
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('is_active', false)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            !data.is_active
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ring-2 ring-red-500'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                !data.is_active ? 'bg-red-500' : 'bg-gray-400'
                                            }`}
                                        />
                                        Inactive
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Inactive coupons cannot be used by customers.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AdminLayout>
    );
}
