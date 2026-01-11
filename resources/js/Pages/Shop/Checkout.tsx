import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import ShopLayout from "@/Layouts/ShopLayout";
import { Button, Input, Card, CardHeader, CardContent } from "@/Components/ui";
import { Cart, User } from "@/types/models";
import { formatPrice } from "@/lib/utils";
import {
    Truck,
    RotateCcw,
    Clock,
    ArrowLeft,
    ArrowRight,
    Tag,
    X,
    Check,
    Loader2,
    MessageCircle,
    CheckCircle,
} from "lucide-react";
import axios from "axios";

interface AppliedCoupon {
    id: number;
    code: string;
    name: string;
    name_ar: string | null;
    type: "percentage" | "fixed";
    value: number;
    discount: number;
}

interface Props {
    cart: Cart;
    stockErrors: { product: string; requested: number; available: number }[];
    user: User | null;
    appliedCoupon: AppliedCoupon | null;
}

export default function Checkout({
    cart,
    stockErrors,
    user,
    appliedCoupon: initialCoupon,
}: Props) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const isRTL = language === "ar";

    // Simplified form data - only essential fields
    const [formData, setFormData] = useState({
        customer_name: user?.name || "",
        customer_phone: "",
        delivery_area: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
        initialCoupon
    );
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const FREE_DELIVERY_THRESHOLD = 100;
    const deliveryFee = cart.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 5;
    const discount = appliedCoupon?.discount || 0;
    const total = cart.subtotal + deliveryFee - discount;

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.customer_name.trim()) {
            errors.customer_name = t("checkout:validation.nameRequired");
        }
        if (!formData.customer_phone.trim()) {
            errors.customer_phone = t("checkout:validation.phoneRequired");
        }
        if (!formData.delivery_area.trim()) {
            errors.delivery_area = t("checkout:validation.areaRequired");
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const generateWhatsAppMessage = (orderNum: string): string => {
        const lines: string[] = [];

        // Header - no emojis, using text formatting
        if (isRTL) {
            lines.push(`*[طلب جديد #${orderNum}]*`);
            lines.push("من متجر HardRock");
            lines.push("");
            lines.push("*معلومات العميل:*");
            lines.push(`- الاسم: ${formData.customer_name}`);
            lines.push(`- الهاتف: ${formData.customer_phone}`);
            lines.push(`- المنطقة: ${formData.delivery_area}`);
            lines.push("");
            lines.push("*تفاصيل الطلب:*");
        } else {
            lines.push(`*[New Order #${orderNum}]*`);
            lines.push("from HardRock Store");
            lines.push("");
            lines.push("*Customer Information:*");
            lines.push(`- Name: ${formData.customer_name}`);
            lines.push(`- Phone: ${formData.customer_phone}`);
            lines.push(`- Area: ${formData.delivery_area}`);
            lines.push("");
            lines.push("*Order Details:*");
        }

        // Order items
        cart.items.forEach((item, index) => {
            const productName =
                isRTL && item.product.name_ar
                    ? item.product.name_ar
                    : item.product.name;
            const itemTotal = formatPrice(item.subtotal, language);
            lines.push(`${index + 1}. ${productName}`);
            lines.push(`   x${item.quantity} = ${itemTotal}`);
        });

        lines.push("");
        lines.push("---");

        // Totals
        if (isRTL) {
            lines.push(`المجموع الفرعي: ${formatPrice(cart.subtotal, language)}`);
            if (deliveryFee === 0) {
                lines.push("التوصيل: مجاني");
            } else {
                lines.push(`التوصيل: ${formatPrice(deliveryFee, language)}`);
            }
            if (discount > 0) {
                lines.push(
                    `الخصم (${appliedCoupon?.code}): -${formatPrice(discount, language)}`
                );
            }
            lines.push("");
            lines.push(`*الإجمالي: ${formatPrice(total, language)}*`);
        } else {
            lines.push(`Subtotal: ${formatPrice(cart.subtotal, language)}`);
            if (deliveryFee === 0) {
                lines.push("Delivery: FREE");
            } else {
                lines.push(`Delivery: ${formatPrice(deliveryFee, language)}`);
            }
            if (discount > 0) {
                lines.push(
                    `Discount (${appliedCoupon?.code}): -${formatPrice(discount, language)}`
                );
            }
            lines.push("");
            lines.push(`*Total: ${formatPrice(total, language)}*`);
        }

        return lines.join("\n");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Create order in database
            const response = await axios.post("/checkout/whatsapp", {
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                delivery_area: formData.delivery_area,
            });

            if (response.data.success) {
                const orderNum = response.data.order_number;
                setOrderNumber(orderNum);

                // Generate WhatsApp message with order number
                const message = generateWhatsAppMessage(orderNum);

                // WhatsApp number (without + sign for URL)
                const whatsappNumber = "962791700034";

                // Create WhatsApp URL
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

                // Open WhatsApp in new tab
                window.open(whatsappUrl, "_blank");

                // Refresh cart data (cart was cleared on server)
                router.reload({ only: ["cart"] });

                // Show success modal
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            // Still show error to user
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                alert(error.response.data.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoHome = () => {
        router.visit("/");
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError(null);

        try {
            const response = await axios.post("/coupon/apply", {
                code: couponCode.trim(),
            });

            if (response.data.success) {
                setAppliedCoupon(response.data.coupon);
                setCouponCode("");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data) {
                const errorKey = error.response.data.error;
                const minOrderAmount = error.response.data.min_order_amount;

                const errorMap: Record<string, string> = {
                    coupon_not_found: "not_found",
                    coupon_inactive: "inactive",
                    coupon_not_started: "not_started",
                    coupon_expired: "expired",
                    coupon_exhausted: "exhausted",
                    coupon_user_limit: "user_limit",
                    coupon_min_order: "min_order",
                };

                const translationKey = errorMap[errorKey] || "not_found";

                if (translationKey === "min_order" && minOrderAmount) {
                    setCouponError(
                        t(`checkout:coupon.errors.${translationKey}`, {
                            amount: formatPrice(minOrderAmount, language),
                        })
                    );
                } else {
                    setCouponError(
                        t(`checkout:coupon.errors.${translationKey}`)
                    );
                }
            } else {
                setCouponError(t("checkout:coupon.errors.not_found"));
            }
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = async () => {
        setCouponLoading(true);

        try {
            await axios.post("/coupon/remove");
            setAppliedCoupon(null);
            setCouponError(null);
        } catch {
            // Silently fail
        } finally {
            setCouponLoading(false);
        }
    };

    const BackArrow = isRTL ? ArrowRight : ArrowLeft;

    const getCouponName = () => {
        if (!appliedCoupon) return "";
        return isRTL && appliedCoupon.name_ar
            ? appliedCoupon.name_ar
            : appliedCoupon.name;
    };

    const getCouponDescription = () => {
        if (!appliedCoupon) return "";
        if (appliedCoupon.type === "percentage") {
            return t("checkout:coupon.percentOff", {
                percent: appliedCoupon.value,
            });
        }
        return t("checkout:coupon.fixedOff", {
            amount: formatPrice(appliedCoupon.value, language),
        });
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <ShopLayout>
            <Head title={t("checkout:title")} />

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t("checkout:orderSent")}
                        </h2>
                        <p className="text-gray-600 mb-2">
                            {t("checkout:orderSentDesc")}
                        </p>
                        {orderNumber && (
                            <p className="text-sm text-gray-500 mb-6">
                                {t("checkout:orderNumber")}: <span className="font-semibold">{orderNumber}</span>
                            </p>
                        )}
                        <Button
                            onClick={handleGoHome}
                            size="lg"
                            className="w-full"
                        >
                            {t("checkout:backToHome")}
                        </Button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t("checkout:title")}
                    </h1>
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <BackArrow className="h-4 w-4" />
                        {t("checkout:backToCart")}
                    </Link>
                </div>

                {stockErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h3 className="text-red-800 font-semibold mb-2">
                            {t("checkout:stockIssues")}
                        </h3>
                        {stockErrors.map((error, index) => (
                            <p key={index} className="text-red-700 text-sm">
                                {t("checkout:stockError", {
                                    product: error.product,
                                    available: error.available,
                                    requested: error.requested,
                                })}
                            </p>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Simplified Form - Left Side */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">
                                        {t("checkout:quickOrder")}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {t("checkout:quickOrderDesc")}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        id="customer_name"
                                        name="customer_name"
                                        label={t("checkout:form.name")}
                                        value={formData.customer_name}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "customer_name",
                                                e.target.value
                                            )
                                        }
                                        error={formErrors.customer_name}
                                        placeholder={t(
                                            "checkout:placeholders.name"
                                        )}
                                        autoComplete="name"
                                        required
                                    />
                                    <Input
                                        id="customer_phone"
                                        name="customer_phone"
                                        label={t("checkout:form.phone")}
                                        type="tel"
                                        value={formData.customer_phone}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "customer_phone",
                                                e.target.value
                                            )
                                        }
                                        error={formErrors.customer_phone}
                                        placeholder={t(
                                            "checkout:placeholders.phone"
                                        )}
                                        autoComplete="tel"
                                        required
                                        dir="ltr"
                                    />
                                    <Input
                                        id="delivery_area"
                                        name="delivery_area"
                                        label={t("checkout:form.area")}
                                        value={formData.delivery_area}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "delivery_area",
                                                e.target.value
                                            )
                                        }
                                        error={formErrors.delivery_area}
                                        placeholder={t(
                                            "checkout:placeholders.area"
                                        )}
                                        autoComplete="address-level2"
                                        required
                                    />
                                </CardContent>
                            </Card>

                            {/* Delivery Info */}
                            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Truck className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {t("checkout:freeDelivery")}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t("checkout:freeDeliveryDesc", {
                                                amount: formatPrice(
                                                    FREE_DELIVERY_THRESHOLD,
                                                    language
                                                ),
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {t("checkout:fastDelivery")}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t("checkout:fastDeliveryDesc")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <RotateCcw className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {t("checkout:easyReturns")}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t("checkout:easyReturnsDesc")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary - Right Side */}
                        <div>
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">
                                        {t("checkout:orderSummary")}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 mb-6">
                                        {cart.items.map((item) => {
                                            const productName =
                                                isRTL && item.product.name_ar
                                                    ? item.product.name_ar
                                                    : item.product.name;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="text-gray-600">
                                                        {productName} ×{" "}
                                                        {item.quantity}
                                                    </span>
                                                    <div className="text-right">
                                                        {item.product
                                                            .compare_price &&
                                                            item.product
                                                                .compare_price >
                                                                item.product
                                                                    .price && (
                                                                <span className="block text-xs text-gray-400 line-through">
                                                                    {formatPrice(
                                                                        item
                                                                            .product
                                                                            .compare_price *
                                                                            item.quantity,
                                                                        language
                                                                    )}
                                                                </span>
                                                            )}
                                                        <span>
                                                            {formatPrice(
                                                                item.subtotal,
                                                                language
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Coupon Section */}
                                    <div className="border-t pt-4 mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {t("checkout:coupon.title")}
                                            </span>
                                        </div>

                                        {appliedCoupon ? (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-2">
                                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-green-800">
                                                                {getCouponName()}
                                                            </p>
                                                            <p className="text-xs text-green-600">
                                                                {getCouponDescription()}
                                                            </p>
                                                            <p className="text-xs text-green-700 mt-1 font-medium">
                                                                {t(
                                                                    "checkout:coupon.youSave",
                                                                    {
                                                                        amount: formatPrice(
                                                                            discount,
                                                                            language
                                                                        ),
                                                                    }
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={removeCoupon}
                                                        disabled={couponLoading}
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                    >
                                                        {couponLoading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <X className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={(e) => {
                                                            setCouponCode(
                                                                e.target.value.toUpperCase()
                                                            );
                                                            setCouponError(
                                                                null
                                                            );
                                                        }}
                                                        placeholder={t(
                                                            "checkout:coupon.placeholder"
                                                        )}
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none uppercase"
                                                        dir="ltr"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={applyCoupon}
                                                        disabled={
                                                            couponLoading ||
                                                            !couponCode.trim()
                                                        }
                                                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {couponLoading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                {t(
                                                                    "checkout:coupon.applying"
                                                                )}
                                                            </>
                                                        ) : (
                                                            t(
                                                                "checkout:coupon.apply"
                                                            )
                                                        )}
                                                    </button>
                                                </div>
                                                {couponError && (
                                                    <p className="text-red-600 text-xs mt-2">
                                                        {couponError}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                {t("checkout:subtotal")}
                                            </span>
                                            <span>
                                                {formatPrice(
                                                    cart.subtotal,
                                                    language
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                {t("checkout:deliveryFee")}
                                            </span>
                                            {deliveryFee === 0 ? (
                                                <span className="text-green-600">
                                                    {t("checkout:free")}
                                                </span>
                                            ) : (
                                                <span>
                                                    {formatPrice(
                                                        deliveryFee,
                                                        language
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>
                                                    {t("checkout:discount")}
                                                </span>
                                                <span>
                                                    -
                                                    {formatPrice(
                                                        discount,
                                                        language
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                                            <span>{t("checkout:total")}</span>
                                            <span>
                                                {formatPrice(total, language)}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full mt-6 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                                        disabled={stockErrors.length > 0 || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                {t("checkout:processing")}
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle className="h-5 w-5" />
                                                {t("checkout:orderViaWhatsApp")}
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        {t("checkout:whatsAppNote")}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </ShopLayout>
    );
}
