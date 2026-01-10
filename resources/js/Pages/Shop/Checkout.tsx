import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
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
    const { data, setData, post, processing, errors } = useForm({
        customer_name: user?.name || "",
        customer_email: user?.email || "",
        customer_phone: "",
        delivery_area: "",
        delivery_street: "",
        delivery_building: "",
        delivery_notes: "",
        notes: "",
    });

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
        initialCoupon
    );
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/checkout");
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

                // Map error keys to translation keys
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
            // Silently fail - coupon might already be removed
        } finally {
            setCouponLoading(false);
        }
    };

    const FREE_DELIVERY_THRESHOLD = 100;
    const deliveryFee = cart.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 5;
    const discount = appliedCoupon?.discount || 0;
    const total = cart.subtotal + deliveryFee - discount;

    const BackArrow = isRTL ? ArrowRight : ArrowLeft;

    // Get coupon name based on language
    const getCouponName = () => {
        if (!appliedCoupon) return "";
        return isRTL && appliedCoupon.name_ar
            ? appliedCoupon.name_ar
            : appliedCoupon.name;
    };

    // Get coupon description
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

    return (
        <ShopLayout>
            <Head title={t("checkout:title")} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">
                                        {t("checkout:contactInfo")}
                                    </h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            id="customer_name"
                                            name="customer_name"
                                            label={t("checkout:form.name")}
                                            value={data.customer_name}
                                            onChange={(e) =>
                                                setData(
                                                    "customer_name",
                                                    e.target.value
                                                )
                                            }
                                            error={errors.customer_name}
                                            placeholder={t(
                                                "checkout:placeholders.name"
                                            )}
                                            autoComplete="name"
                                            required
                                        />
                                        <Input
                                            id="customer_email"
                                            name="customer_email"
                                            label={t("checkout:form.email")}
                                            type="email"
                                            value={data.customer_email}
                                            onChange={(e) =>
                                                setData(
                                                    "customer_email",
                                                    e.target.value
                                                )
                                            }
                                            error={errors.customer_email}
                                            placeholder={t(
                                                "checkout:placeholders.email"
                                            )}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                    <Input
                                        id="customer_phone"
                                        name="customer_phone"
                                        label={t("checkout:form.phone")}
                                        type="tel"
                                        value={data.customer_phone}
                                        onChange={(e) =>
                                            setData(
                                                "customer_phone",
                                                e.target.value
                                            )
                                        }
                                        error={errors.customer_phone}
                                        placeholder={t(
                                            "checkout:placeholders.phone"
                                        )}
                                        autoComplete="tel"
                                        required
                                        dir="ltr"
                                    />
                                </CardContent>
                            </Card>

                            {/* Delivery Address */}
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">
                                        {t("checkout:deliveryAddress")}
                                    </h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        id="delivery_area"
                                        name="delivery_area"
                                        label={t("checkout:form.area")}
                                        value={data.delivery_area}
                                        onChange={(e) =>
                                            setData(
                                                "delivery_area",
                                                e.target.value
                                            )
                                        }
                                        error={errors.delivery_area}
                                        placeholder={t(
                                            "checkout:placeholders.area"
                                        )}
                                        autoComplete="address-level2"
                                        required
                                    />
                                    <Input
                                        id="delivery_street"
                                        name="delivery_street"
                                        label={t("checkout:form.street")}
                                        value={data.delivery_street}
                                        onChange={(e) =>
                                            setData(
                                                "delivery_street",
                                                e.target.value
                                            )
                                        }
                                        error={errors.delivery_street}
                                        placeholder={t(
                                            "checkout:placeholders.street"
                                        )}
                                        autoComplete="street-address"
                                        required
                                    />
                                    <Input
                                        id="delivery_building"
                                        name="delivery_building"
                                        label={t("checkout:form.building")}
                                        value={data.delivery_building}
                                        onChange={(e) =>
                                            setData(
                                                "delivery_building",
                                                e.target.value
                                            )
                                        }
                                        error={errors.delivery_building}
                                        placeholder={t(
                                            "checkout:placeholders.building"
                                        )}
                                        autoComplete="address-line2"
                                        required
                                    />
                                    <div>
                                        <label
                                            htmlFor="delivery_notes"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            {t("checkout:form.deliveryNotes")}
                                        </label>
                                        <textarea
                                            id="delivery_notes"
                                            name="delivery_notes"
                                            value={data.delivery_notes}
                                            onChange={(e) =>
                                                setData(
                                                    "delivery_notes",
                                                    e.target.value
                                                )
                                            }
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none text-sm"
                                            placeholder={t(
                                                "checkout:placeholders.deliveryNotes"
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes */}
                            <Card>
                                <CardHeader>
                                    <label
                                        htmlFor="order_notes"
                                        className="text-lg font-semibold"
                                    >
                                        {t("checkout:orderNotes")}
                                    </label>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        id="order_notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData("notes", e.target.value)
                                        }
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                        placeholder={t(
                                            "checkout:placeholders.notes"
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
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
                                        className="w-full mt-6"
                                        disabled={
                                            processing || stockErrors.length > 0
                                        }
                                    >
                                        {t("checkout:placeOrder")}
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        {t("checkout:demoDisclaimer")}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Delivery & Returns Policy */}
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
                    </div>
                </form>
            </div>
        </ShopLayout>
    );
}
