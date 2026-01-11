import { useState, useMemo, useRef } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import ShopLayout from "@/Layouts/ShopLayout";
import {
    Button,
    Input,
    Card,
    CardHeader,
    CardContent,
} from "@/Components/ui";
import { User, Order, Coupon, ProfileStats } from "@/types/models";
import { formatPrice } from "@/lib/utils";
import {
    User as UserIcon,
    Package,
    Ticket,
    Settings,
    ShoppingBag,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Eye,
    Copy,
    Check,
    Loader2,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    AlertTriangle,
    Trash2,
    Lock,
    LogOut,
    ChevronRight,
    Gift,
    TrendingUp,
    Heart,
    Camera,
    X,
} from "lucide-react";

// Validation helpers
const validateName = (name: string): { isValid: boolean; error: string | null } => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        return { isValid: false, error: "nameRequired" };
    }

    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);

    if (words.length < 2) {
        return { isValid: false, error: "nameTwoWords" };
    }

    const allWordsValid = words.every(word => word.length >= 2);
    if (!allWordsValid) {
        return { isValid: false, error: "nameWordLength" };
    }

    return { isValid: true, error: null };
};

const validatePhone = (phone: string): { isValid: boolean; error: string | null } => {
    if (!phone || phone.trim() === "") {
        return { isValid: true, error: null }; // Phone is optional
    }

    // Remove spaces, dashes, parentheses for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Check if it's a valid phone format (7-15 digits, may start with +)
    const phoneRegex = /^\+?[0-9]{7,15}$/;

    if (!phoneRegex.test(cleanPhone)) {
        return { isValid: false, error: "phoneInvalid" };
    }

    return { isValid: true, error: null };
};

interface Props {
    user: User;
    orders: Order[];
    coupons: Coupon[];
    stats: ProfileStats;
    activeTab: string;
}

type TabType = "overview" | "orders" | "coupons" | "settings";

export default function Profile({
    user,
    orders,
    coupons,
    stats,
    activeTab: initialTab,
}: Props) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const isRTL = language === "ar";

    const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile form
    const profileForm = useForm({
        name: user.name,
        phone: user.phone || "",
    });

    // Password form
    const passwordForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    // Delete form
    const deleteForm = useForm({
        confirmation: "",
    });

    // Validation states
    const nameValidation = useMemo(() => validateName(profileForm.data.name), [profileForm.data.name]);
    const phoneValidation = useMemo(() => validatePhone(profileForm.data.phone), [profileForm.data.phone]);

    // Check if profile form has changes and is valid
    const profileHasChanges = profileForm.data.name !== user.name || profileForm.data.phone !== (user.phone || "");
    const profileIsValid = nameValidation.isValid && phoneValidation.isValid;
    const canSaveProfile = profileHasChanges && profileIsValid && !profileForm.processing;

    // Check if password form has valid data
    const passwordHasData = passwordForm.data.current_password.length > 0 &&
        passwordForm.data.password.length >= 8 &&
        passwordForm.data.password === passwordForm.data.password_confirmation;
    const canUpdatePassword = passwordHasData && !passwordForm.processing;

    // Delete confirmation - user must type "delete {first_name}"
    const userFirstName = user.name.split(" ")[0].toLowerCase();
    const deleteConfirmPhrase = `delete ${userFirstName}`;
    const canDeleteAccount = deleteConfirmText.toLowerCase() === deleteConfirmPhrase && !deleteForm.processing;

    const tabs: { id: TabType; label: string; icon: typeof UserIcon; count?: number }[] = [
        { id: "overview", label: t("profile:tabs.overview"), icon: UserIcon },
        { id: "orders", label: t("profile:tabs.orders"), icon: Package, count: stats.total_orders },
        { id: "coupons", label: t("profile:tabs.coupons"), icon: Ticket, count: coupons.length },
        { id: "settings", label: t("profile:tabs.settings"), icon: Settings },
    ];

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        router.get(
            `/profile`,
            { tab },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case "processing":
                return <Package className="h-4 w-4 text-blue-500" />;
            case "shipped":
                return <Truck className="h-4 w-4 text-purple-500" />;
            case "delivered":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "cancelled":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "shipped":
                return "bg-purple-100 text-purple-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSaveProfile) return;

        profileForm.patch("/profile/update", {
            preserveScroll: true,
        });
    };

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canUpdatePassword) return;

        passwordForm.patch("/profile/password", {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    const handleDeleteAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canDeleteAccount) return;

        deleteForm.delete("/profile", {
            preserveScroll: true,
        });
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteConfirmText("");
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        const formData = new FormData();
        formData.append("avatar", file);

        router.post("/profile/avatar", formData, {
            preserveScroll: true,
            onFinish: () => {
                setAvatarUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            },
        });
    };

    const handleRemoveAvatar = () => {
        router.delete("/profile/avatar", {
            preserveScroll: true,
        });
    };

    const getAvatarUrl = () => {
        if (!user.avatar) return null;
        return `/storage/${user.avatar}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(language === "ar" ? "ar-JO" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(date);
    };

    const getDaysUntilExpiry = (endsAt: string | null) => {
        if (!endsAt) return null;
        const now = new Date();
        const end = new Date(endsAt);
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <ShopLayout>
            <Head title={t("profile:title")} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-brand-purple to-brand-purple-600 rounded-2xl p-6 mb-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <UserIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-white/80 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                                <p className="text-xs text-gray-500">{t("profile:stats.totalOrders")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.total_spent, language)}</p>
                                <p className="text-xs text-gray-500">{t("profile:stats.totalSpent")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
                                <p className="text-xs text-gray-500">{t("profile:stats.pendingOrders")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                <Ticket className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
                                <p className="text-xs text-gray-500">{t("profile:stats.availableCoupons")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-brand-purple text-white shadow-md"
                                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span
                                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            activeTab === tab.id
                                                ? "bg-white/20"
                                                : "bg-gray-100"
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Orders */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <Package className="h-5 w-5 text-brand-purple" />
                                            {t("profile:overview.recentOrders")}
                                        </h2>
                                        <button
                                            onClick={() => handleTabChange("orders")}
                                            className="text-sm text-brand-purple hover:underline flex items-center gap-1"
                                        >
                                            {t("profile:overview.viewAll")}
                                            <ChevronRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {orders.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                            <p>{t("profile:overview.noOrders")}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orders.slice(0, 3).map((order) => (
                                                <div
                                                    key={order.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {getStatusIcon(order.status)}
                                                        <div>
                                                            <p className="font-medium text-sm">#{order.order_number}</p>
                                                            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-sm">{formatPrice(order.total, language)}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                                            {t(`profile:orderStatus.${order.status}`)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Available Coupons */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <Gift className="h-5 w-5 text-brand-orange" />
                                            {t("profile:overview.availableCoupons")}
                                        </h2>
                                        <button
                                            onClick={() => handleTabChange("coupons")}
                                            className="text-sm text-brand-purple hover:underline flex items-center gap-1"
                                        >
                                            {t("profile:overview.viewAll")}
                                            <ChevronRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {coupons.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                            <p>{t("profile:overview.noCoupons")}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {coupons.slice(0, 3).map((coupon) => {
                                                const daysLeft = getDaysUntilExpiry(coupon.ends_at);
                                                return (
                                                    <div
                                                        key={coupon.id}
                                                        className="flex items-center justify-between p-3 bg-gradient-to-r from-brand-purple/5 to-brand-orange/5 rounded-lg border border-brand-purple/20"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-brand-purple">{coupon.code}</span>
                                                                <span className="text-sm text-green-600 font-medium">
                                                                    {coupon.type === "percentage"
                                                                        ? `${coupon.value}%`
                                                                        : formatPrice(coupon.value, language)}{" "}
                                                                    {t("profile:coupons.off")}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {isRTL && coupon.name_ar ? coupon.name_ar : coupon.name}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(coupon.code)}
                                                            className="p-2 hover:bg-white rounded-lg transition-colors"
                                                        >
                                                            {copiedCode === coupon.code ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Account Info */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <UserIcon className="h-5 w-5 text-brand-purple" />
                                        {t("profile:overview.accountInfo")}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">{t("profile:fields.email")}</p>
                                                <p className="font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">{t("profile:fields.phone")}</p>
                                                <p className="font-medium">{user.phone || t("profile:fields.notSet")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">{t("profile:fields.memberSince")}</p>
                                                <p className="font-medium">{formatDate(user.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="h-5 w-5 text-brand-purple" />
                                    {t("profile:orders.title")}
                                </h2>
                            </CardHeader>
                            <CardContent>
                                {orders.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium mb-2">{t("profile:orders.empty")}</p>
                                        <p className="text-sm">{t("profile:orders.emptyDesc")}</p>
                                        <Button
                                            onClick={() => router.visit("/")}
                                            className="mt-4"
                                        >
                                            {t("profile:orders.startShopping")}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div className="bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-4">
                                                        {getStatusIcon(order.status)}
                                                        <div>
                                                            <p className="font-semibold">#{order.order_number}</p>
                                                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                            {t(`profile:orderStatus.${order.status}`)}
                                                        </span>
                                                        <span className="font-bold text-lg">{formatPrice(order.total, language)}</span>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="space-y-2">
                                                        {order.items?.slice(0, 3).map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">
                                                                    {item.product_name} × {item.quantity}
                                                                </span>
                                                                <span>{formatPrice(item.subtotal, language)}</span>
                                                            </div>
                                                        ))}
                                                        {order.items && order.items.length > 3 && (
                                                            <p className="text-sm text-gray-400">
                                                                +{order.items.length - 3} {t("profile:orders.moreItems")}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 pt-3 border-t flex justify-end">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="text-brand-purple hover:underline text-sm flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            {t("profile:orders.viewDetails")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Coupons Tab */}
                    {activeTab === "coupons" && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Ticket className="h-5 w-5 text-brand-purple" />
                                    {t("profile:coupons.title")}
                                </h2>
                            </CardHeader>
                            <CardContent>
                                {coupons.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium mb-2">{t("profile:coupons.empty")}</p>
                                        <p className="text-sm">{t("profile:coupons.emptyDesc")}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {coupons.map((coupon) => {
                                            const daysLeft = getDaysUntilExpiry(coupon.ends_at);
                                            const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
                                            return (
                                                <div
                                                    key={coupon.id}
                                                    className="relative overflow-hidden border-2 border-dashed border-brand-purple/30 rounded-xl p-4 bg-gradient-to-br from-brand-purple/5 to-brand-orange/5"
                                                >
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-purple/10 rounded-bl-full" />
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xl font-bold text-brand-purple">{coupon.code}</span>
                                                                <button
                                                                    onClick={() => copyToClipboard(coupon.code)}
                                                                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                                    title={t("profile:coupons.copy")}
                                                                >
                                                                    {copiedCode === coupon.code ? (
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                {isRTL && coupon.name_ar ? coupon.name_ar : coupon.name}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                                    {coupon.type === "percentage"
                                                                        ? `${coupon.value}% ${t("profile:coupons.off")}`
                                                                        : `${formatPrice(coupon.value, language)} ${t("profile:coupons.off")}`}
                                                                </span>
                                                                {coupon.min_order_amount && (
                                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                                        {t("profile:coupons.minOrder", { amount: formatPrice(coupon.min_order_amount, language) })}
                                                                    </span>
                                                                )}
                                                                {isExpiringSoon && daysLeft !== null && (
                                                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        {daysLeft === 0
                                                                            ? t("profile:coupons.expiresToday")
                                                                            : t("profile:coupons.expiresIn", { days: daysLeft })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                        <div className="space-y-6">
                            {/* Profile Picture */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Camera className="h-5 w-5 text-brand-purple" />
                                        {t("profile:settings.profilePicture")}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-6">
                                        {/* Avatar Preview */}
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                                {getAvatarUrl() ? (
                                                    <img
                                                        src={getAvatarUrl()!}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-brand-purple/10">
                                                        <UserIcon className="h-12 w-12 text-brand-purple/50" />
                                                    </div>
                                                )}
                                            </div>
                                            {avatarUploading && (
                                                <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Controls */}
                                        <div className="flex-1 space-y-3">
                                            <p className="text-sm text-gray-600">
                                                {t("profile:settings.avatarHint")}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                                    onChange={handleAvatarChange}
                                                    className="hidden"
                                                    id="avatar-upload"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={avatarUploading}
                                                >
                                                    <Camera className="h-4 w-4 me-2" />
                                                    {user.avatar ? t("profile:settings.changePhoto") : t("profile:settings.uploadPhoto")}
                                                </Button>
                                                {user.avatar && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleRemoveAvatar}
                                                        disabled={avatarUploading}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4 me-2" />
                                                        {t("profile:settings.removePhoto")}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Edit Profile */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <UserIcon className="h-5 w-5 text-brand-purple" />
                                        {t("profile:settings.editProfile")}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t("profile:fields.name")}
                                                </label>
                                                <Input
                                                    value={profileForm.data.name}
                                                    onChange={(e) => profileForm.setData("name", e.target.value)}
                                                    error={profileForm.errors.name || (nameValidation.error ? t(`profile:validation.${nameValidation.error}`) : undefined)}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t("profile:validation.nameHint")}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t("profile:fields.phone")}
                                                </label>
                                                <Input
                                                    value={profileForm.data.phone}
                                                    onChange={(e) => profileForm.setData("phone", e.target.value)}
                                                    error={profileForm.errors.phone || (phoneValidation.error ? t(`profile:validation.${phoneValidation.error}`) : undefined)}
                                                    placeholder={t("profile:placeholders.phone")}
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            {!profileHasChanges && (
                                                <p className="text-sm text-gray-400">
                                                    {t("profile:settings.noChanges")}
                                                </p>
                                            )}
                                            <div className={!profileHasChanges ? "ml-auto" : ""}>
                                                <Button
                                                    type="submit"
                                                    disabled={!canSaveProfile}
                                                    className={!canSaveProfile ? "opacity-50" : ""}
                                                >
                                                    {profileForm.processing ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        t("profile:settings.saveChanges")
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Change Password */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-brand-purple" />
                                        {t("profile:settings.changePassword")}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t("profile:fields.currentPassword")}
                                            </label>
                                            <Input
                                                type="password"
                                                value={passwordForm.data.current_password}
                                                onChange={(e) => passwordForm.setData("current_password", e.target.value)}
                                                error={passwordForm.errors.current_password}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t("profile:fields.newPassword")}
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.data.password}
                                                    onChange={(e) => passwordForm.setData("password", e.target.value)}
                                                    error={passwordForm.errors.password}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t("profile:validation.passwordHint")}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t("profile:fields.confirmPassword")}
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.data.password_confirmation}
                                                    onChange={(e) => passwordForm.setData("password_confirmation", e.target.value)}
                                                    error={passwordForm.errors.password_confirmation || (
                                                        passwordForm.data.password_confirmation &&
                                                        passwordForm.data.password !== passwordForm.data.password_confirmation
                                                            ? t("profile:validation.passwordMismatch")
                                                            : undefined
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={!canUpdatePassword}
                                                className={!canUpdatePassword ? "opacity-50" : ""}
                                            >
                                                {passwordForm.processing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    t("profile:settings.updatePassword")
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="border-red-200">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600">
                                        <AlertTriangle className="h-5 w-5" />
                                        {t("profile:settings.dangerZone")}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {t("profile:settings.deleteWarning")}
                                    </p>
                                    <Button
                                        variant="danger"
                                        onClick={() => setShowDeleteModal(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t("profile:settings.deleteAccount")}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">
                                    {t("profile:orders.orderDetails")}
                                </h3>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <XCircle className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">{t("profile:orders.orderNumber")}</span>
                                    <span className="font-semibold">#{selectedOrder.order_number}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">{t("profile:orders.date")}</span>
                                    <span className="font-semibold">{formatDate(selectedOrder.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">{t("profile:orders.status")}</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                                        {t(`profile:orderStatus.${selectedOrder.status}`)}
                                    </span>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">{t("profile:orders.items")}</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.items?.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
                                                <div>
                                                    <p className="font-medium">{item.product_name}</p>
                                                    <p className="text-gray-500">× {item.quantity}</p>
                                                </div>
                                                <span className="font-semibold">{formatPrice(item.subtotal, language)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{t("profile:orders.subtotal")}</span>
                                        <span>{formatPrice(selectedOrder.subtotal, language)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>{t("profile:orders.total")}</span>
                                        <span>{formatPrice(selectedOrder.total, language)}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full mt-6"
                            >
                                {t("profile:orders.close")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {t("profile:settings.deleteConfirmTitle")}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {t("profile:settings.deleteConfirmDesc")}
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                                <p className="text-sm text-red-700 font-medium mb-1">
                                    {t("profile:settings.deleteIrreversible")}
                                </p>
                                <ul className="text-xs text-red-600 space-y-1">
                                    <li>• {t("profile:settings.deleteWarning1")}</li>
                                    <li>• {t("profile:settings.deleteWarning2")}</li>
                                    <li>• {t("profile:settings.deleteWarning3")}</li>
                                </ul>
                            </div>
                        </div>

                        <form onSubmit={handleDeleteAccount}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("profile:settings.typeToConfirm", { phrase: deleteConfirmPhrase })}
                                </label>
                                <Input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder={deleteConfirmPhrase}
                                    className={deleteConfirmText && !canDeleteAccount ? "border-red-300" : ""}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t("profile:settings.typeExactly")} <code className="bg-gray-100 px-1 rounded">{deleteConfirmPhrase}</code>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleCloseDeleteModal}
                                >
                                    {t("profile:settings.cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="danger"
                                    className={`flex-1 ${!canDeleteAccount ? "opacity-50" : ""}`}
                                    disabled={!canDeleteAccount}
                                >
                                    {deleteForm.processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        t("profile:settings.confirmDelete")
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ShopLayout>
    );
}
