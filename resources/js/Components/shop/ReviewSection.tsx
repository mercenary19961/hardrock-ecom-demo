import { useState, useEffect } from "react";
import { useForm, router, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/Components/ui";
import { Review, Product, PaginatedData } from "@/types/models";
import { formatNumber } from "@/lib/utils";
import {
    Star,
    ThumbsUp,
    CheckCircle,
    User,
    Trash2,
    Edit2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface ReviewSectionProps {
    product: Product;
    reviews: PaginatedData<Review>;
    ratingDistribution: Record<number, number>;
    canReview: boolean;
    userReview: Review | null;
    isAuthenticated: boolean;
}

// Star Rating Input Component
function StarRatingInput({
    rating,
    onChange,
}: {
    rating: number;
    onChange: (rating: number) => void;
}) {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                >
                    <Star
                        className={`h-8 w-8 transition-colors ${
                            (hoverRating || rating) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

// Star Rating Display Component
function StarRatingDisplay({
    rating,
    size = "sm",
}: {
    rating: number;
    size?: "sm" | "md";
}) {
    const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => {
                const fill = Math.min(1, Math.max(0, rating - (star - 1)));
                return (
                    <div key={star} className={`relative ${sizeClass}`}>
                        {/* Background empty star */}
                        <Star
                            className={`${sizeClass} fill-gray-200 text-gray-200`}
                        />
                        {/* Precisely filled portion */}
                        {fill > 0 && (
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{
                                    width: `${fill * 100}%`,
                                    left: 0,
                                }}
                            >
                                <Star
                                    className={`${sizeClass} fill-yellow-400 text-yellow-400`}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Review Form Component
function ReviewForm({
    productSlug,
    existingReview,
    onCancel,
    language,
}: {
    productSlug: string;
    existingReview?: Review | null;
    onCancel?: () => void;
    language: string;
}) {
    const { t } = useTranslation();
    const isEditing = !!existingReview;
    const isArabic = language === "ar";

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        rating: existingReview?.rating || 0,
        title: isArabic
            ? existingReview?.title_ar || ""
            : existingReview?.title || "",
        title_ar: isArabic
            ? existingReview?.title_ar || ""
            : existingReview?.title || "",
        comment: isArabic
            ? existingReview?.comment_ar || ""
            : existingReview?.comment || "",
        comment_ar: isArabic
            ? existingReview?.comment_ar || ""
            : existingReview?.comment || "",
        language: existingReview?.language || language || "en",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.rating === 0) return;

        if (isEditing && existingReview) {
            patch(`/review/${existingReview.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    if (onCancel) onCancel();
                },
            });
        } else {
            post(`/product/${productSlug}/review`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing
                    ? t("shop:reviewsSection.editReview")
                    : t("shop:reviewsSection.writeReview")}
            </h3>

            {/* Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("shop:reviewsSection.rating")}{" "}
                    <span className="text-red-500">*</span>
                </label>
                <StarRatingInput
                    rating={data.rating}
                    onChange={(rating) => setData("rating", rating)}
                />
                {data.rating === 0 && errors.rating && (
                    <p className="mt-1 text-sm text-red-500">
                        {t("shop:reviewsSection.ratingRequired")}
                    </p>
                )}
            </div>

            {/* Title */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("shop:reviewsSection.title")}
                </label>
                <input
                    type="text"
                    value={isArabic ? data.title_ar : data.title}
                    onChange={(e) => {
                        if (isArabic) {
                            setData("title_ar", e.target.value);
                        } else {
                            setData("title", e.target.value);
                        }
                    }}
                    placeholder={t("shop:reviewsSection.titlePlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                    maxLength={255}
                />
            </div>

            {/* Comment */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("shop:reviewsSection.comment")}
                </label>
                <textarea
                    value={isArabic ? data.comment_ar : data.comment}
                    onChange={(e) => {
                        if (isArabic) {
                            setData("comment_ar", e.target.value);
                        } else {
                            setData("comment", e.target.value);
                        }
                    }}
                    placeholder={t("shop:reviewsSection.commentPlaceholder")}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent resize-none"
                    maxLength={2000}
                />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
                <Button
                    type="submit"
                    disabled={processing || data.rating === 0}
                >
                    {isEditing
                        ? t("shop:reviewsSection.update")
                        : t("shop:reviewsSection.submit")}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("shop:reviewsSection.cancel")}
                    </Button>
                )}
            </div>
        </form>
    );
}

// Helper to manage reported reviews
const REPORT_STORAGE_KEY = "reported_reviews";
const MAX_REPORTS_WEEKLY = 5;

interface ReportRecord {
    id: number;
    timestamp: number;
}

const getReportedReviews = (): ReportRecord[] => {
    try {
        const stored = localStorage.getItem(REPORT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveReportedReview = (id: number) => {
    const reports = getReportedReviews();
    if (!reports.some((r) => r.id === id)) {
        reports.push({ id, timestamp: Date.now() });
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports));
    }
};

const getRecentReportsCount = (): number => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const reports = getReportedReviews();
    return reports.filter((r) => r.timestamp > oneWeekAgo).length;
};

// Single Review Card Component
function ReviewCard({
    review,
    language,
    isOwnReview,
    onEdit,
    onDelete,
}: {
    review: Review;
    language: string;
    isOwnReview: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [isReported, setIsReported] = useState(() => {
        const reports = getReportedReviews();
        return reports.some((r) => r.id === review.id);
    });
    const [isReporting, setIsReporting] = useState(false);

    // Display title and comment in the language they were written in
    const title = review.language === "ar" ? review.title_ar : review.title;
    const comment =
        review.language === "ar" ? review.comment_ar : review.comment;

    // Check if the individual review is written in Arabic for RTL support if needed
    const isReviewArabic = review.language === "ar";

    const handleHelpful = () => {
        router.post(
            `/review/${review.id}/helpful`,
            {},
            { preserveScroll: true }
        );
    };

    const formattedDate = new Intl.DateTimeFormat(
        isArabic ? "ar-JO" : "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    ).format(new Date(review.created_at));

    if (isReported) {
        return null;
    }

    return (
        <div className="py-8 space-y-3 transition-all duration-500 ease-in-out">
            {/* User Profile */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    <User className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                    {review.user?.name || "Anonymous"}
                </span>
            </div>

            {/* Rating and Title */}
            <div className="flex items-center gap-3">
                <StarRatingDisplay rating={review.rating} />
                {title && (
                    <h4 className="font-bold text-gray-900 text-sm md:text-base">
                        {title}
                    </h4>
                )}
            </div>

            {/* Meta info */}
            <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                    {isArabic
                        ? `تمت المراجعة في الأردن في ${formattedDate}`
                        : `Reviewed in Jordan on ${formattedDate}`}
                </span>
                {review.is_verified_purchase && (
                    <>
                        <span className="text-gray-300">|</span>
                        <span
                            className="font-bold text-brand-orange"
                            style={{ color: "#c45500" }}
                        >
                            {t("shop:reviewsSection.verifiedPurchase")}
                        </span>
                    </>
                )}
            </div>

            {/* Comment */}
            {comment && (
                <p
                    className={`text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-line max-w-3xl ${
                        isReviewArabic ? "font-arabic" : ""
                    }`}
                    dir={isReviewArabic ? "rtl" : "ltr"}
                >
                    {comment}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleHelpful}
                        className={`px-6 py-1 text-sm border rounded-lg shadow-sm transition-all duration-200 ${
                            review.is_helpful
                                ? "bg-brand-purple-50 border-brand-purple text-brand-purple font-medium"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {t("shop:reviewsSection.helpful")}
                    </button>
                    {!isReported && (
                        <button
                            onClick={() => {
                                if (
                                    getRecentReportsCount() >=
                                    MAX_REPORTS_WEEKLY
                                ) {
                                    alert(
                                        isArabic
                                            ? "لقد وصلت إلى الحد الأقصى للبلاغات هذا الأسبوع (5 بلاغات)."
                                            : "You have reached the maximum limit of reports per week (5 reports)."
                                    );
                                    return;
                                }
                                setIsReporting(true);
                                saveReportedReview(review.id);
                                setTimeout(() => {
                                    setIsReporting(false);
                                    setIsReported(true);
                                }, 2000);
                            }}
                            className={`text-sm transition-all duration-300 ${
                                isReporting
                                    ? "text-green-600 font-medium animate-pulse"
                                    : "text-gray-500 hover:text-red-500"
                            }`}
                        >
                            {isReporting
                                ? isArabic
                                    ? "تم الإبلاغ عن التعليق"
                                    : "Comment Reported"
                                : t("shop:reviewsSection.report")}
                        </button>
                    )}
                </div>

                {isOwnReview && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-gray-400 hover:text-brand-purple transition-colors"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {review.helpful_count > 0 && (
                <div className="text-xs text-gray-500">
                    {t(
                        isArabic &&
                            review.helpful_count >= 3 &&
                            review.helpful_count <= 9
                            ? "shop:reviewsSection.helpfulCount_few"
                            : "shop:reviewsSection.helpfulCount",
                        {
                            formattedCount: formatNumber(
                                review.helpful_count,
                                language
                            ),
                        }
                    )}
                </div>
            )}
        </div>
    );
}

// Rating Summary Component
function RatingSummary({
    ratingDistribution,
    averageRating,
    ratingCount,
    language,
}: {
    ratingDistribution: Record<number, number>;
    averageRating: number;
    ratingCount: number;
    language: string;
}) {
    const { t } = useTranslation();
    const isArabic = language === "ar";

    // Format rating distribution for display
    const ratingCounts = [5, 4, 3, 2, 1].map((rating) => {
        const count = ratingDistribution[rating] || 0;
        return {
            rating,
            count,
            percentage: ratingCount > 0 ? (count / ratingCount) * 100 : 0,
        };
    });

    const formattedAverage = new Intl.NumberFormat(
        isArabic ? "ar-JO" : "en-JO",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }
    ).format(averageRating);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <StarRatingDisplay rating={averageRating} size="md" />
                <span className="text-lg font-bold text-gray-900">
                    {formattedAverage} {isArabic ? "من ٥" : "out of 5"}
                </span>
            </div>

            <p className="text-sm text-gray-500">
                {t(
                    isArabic && ratingCount >= 3 && ratingCount <= 9
                        ? "shop:reviewsSection.basedOn_few"
                        : "shop:reviewsSection.basedOn",
                    {
                        formattedCount: formatNumber(ratingCount, language),
                    }
                )}
            </p>

            {/* Rating bars */}
            <div className="space-y-3 pt-2">
                {ratingCounts.map(({ rating, percentage }) => (
                    <div
                        key={rating}
                        className="flex items-center gap-4 w-full group text-left"
                    >
                        <span className="text-sm font-medium w-16 shrink-0 whitespace-nowrap">
                            {formatNumber(rating, language)}{" "}
                            {isArabic ? "نجوم" : "star"}
                        </span>
                        <div className="flex-1 h-5 bg-gray-100 rounded border border-gray-200 overflow-hidden relative min-w-[150px] md:min-w-[200px]">
                            <div
                                className="h-full bg-brand-orange transition-all duration-500 rounded-sm"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: "#e67a00",
                                }}
                            />
                        </div>
                        <span className="text-sm text-gray-500 min-w-[32px] text-right">
                            {formatNumber(Math.round(percentage), language)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main Review Section Component
export function ReviewSection({
    product,
    reviews,
    ratingDistribution,
    canReview,
    userReview,
    isAuthenticated,
}: ReviewSectionProps) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const isArabic = language === "ar";
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    const handleDeleteReview = (review: Review) => {
        if (confirm(t("shop:reviewsSection.deleteConfirm"))) {
            router.delete(`/review/${review.id}`, { preserveScroll: true });
        }
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(
                url,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ["reviews"],
                }
            );
        }
    };

    return (
        <section className="mt-16 pt-12 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-12">
                <div className="space-y-8">
                    <div>
                        {product.rating_count > 0 ? (
                            <RatingSummary
                                ratingDistribution={ratingDistribution}
                                averageRating={product.average_rating}
                                ratingCount={product.rating_count}
                                language={language}
                            />
                        ) : (
                            <div className="text-gray-500 mb-6">
                                {t("shop:reviewsSection.noReviews")}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-gray-200">
                        {isAuthenticated ? (
                            <>
                                {canReview && !showForm && !editingReview && (
                                    <Button
                                        onClick={() => setShowForm(true)}
                                        variant="outline"
                                        className="w-full py-2 border-gray-300 hover:bg-gray-50 shadow-sm"
                                    >
                                        {t("shop:reviewsSection.writeReview")}
                                    </Button>
                                )}

                                {showForm && (
                                    <div className="mt-6">
                                        <ReviewForm
                                            productSlug={product.slug}
                                            language={language}
                                            onCancel={() => setShowForm(false)}
                                        />
                                    </div>
                                )}

                                {editingReview && (
                                    <div className="mt-6">
                                        <ReviewForm
                                            productSlug={product.slug}
                                            existingReview={editingReview}
                                            language={language}
                                            onCancel={() =>
                                                setEditingReview(null)
                                            }
                                        />
                                    </div>
                                )}

                                {!canReview && !userReview && (
                                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {t(
                                            "shop:reviewsSection.mustPurchaseToReview"
                                        )}
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <a href="/login">
                                    <Button
                                        variant="outline"
                                        className="w-full py-3"
                                    >
                                        {t("shop:reviewsSection.loginToReview")}
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Review List */}
                <div>
                    {reviews.total > 0 ? (
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                {t("shop:reviewsSection.topReviewsFrom")}
                            </h3>

                            <div className="divide-y divide-gray-200">
                                {reviews.data.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        language={language}
                                        isOwnReview={
                                            userReview?.id === review.id
                                        }
                                        onEdit={() => {
                                            setEditingReview(review);
                                            setShowForm(false);
                                            window.scrollTo({
                                                top:
                                                    (document
                                                        .querySelector(
                                                            "section.mt-16"
                                                        )
                                                        ?.getBoundingClientRect()
                                                        .top ?? 0) +
                                                    window.scrollY -
                                                    100,
                                                behavior: "smooth",
                                            });
                                        }}
                                        onDelete={() =>
                                            handleDeleteReview(review)
                                        }
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {reviews.last_page > 1 && (
                                <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <Button
                                            onClick={() =>
                                                handlePageChange(
                                                    reviews.links[0].url
                                                )
                                            }
                                            disabled={!reviews.links[0].url}
                                            variant="outline"
                                        >
                                            {t("common:previous")}
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                handlePageChange(
                                                    reviews.links[
                                                        reviews.links.length - 1
                                                    ].url
                                                )
                                            }
                                            disabled={
                                                !reviews.links[
                                                    reviews.links.length - 1
                                                ].url
                                            }
                                            variant="outline"
                                        >
                                            {t("common:next")}
                                        </Button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                {isArabic ? (
                                                    <>
                                                        عرض من{" "}
                                                        <span className="font-medium">
                                                            {formatNumber(
                                                                reviews.from,
                                                                language
                                                            )}
                                                        </span>{" "}
                                                        إلى{" "}
                                                        <span className="font-medium">
                                                            {formatNumber(
                                                                reviews.to,
                                                                language
                                                            )}
                                                        </span>{" "}
                                                        من أصل{" "}
                                                        <span className="font-medium">
                                                            {formatNumber(
                                                                reviews.total,
                                                                language
                                                            )}
                                                        </span>{" "}
                                                        مراجعة
                                                    </>
                                                ) : (
                                                    <>
                                                        Showing{" "}
                                                        <span className="font-medium">
                                                            {reviews.from}
                                                        </span>{" "}
                                                        to{" "}
                                                        <span className="font-medium">
                                                            {reviews.to}
                                                        </span>{" "}
                                                        of{" "}
                                                        <span className="font-medium">
                                                            {reviews.total}
                                                        </span>{" "}
                                                        reviews
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <nav
                                                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                                aria-label="Pagination"
                                            >
                                                {reviews.links.map(
                                                    (link, index) => {
                                                        // Handle entities in labels (like &laquo; Previous)
                                                        let label = link.label;
                                                        if (index === 0)
                                                            label = isArabic
                                                                ? "التالي"
                                                                : "Previous";
                                                        if (
                                                            index ===
                                                            reviews.links
                                                                .length -
                                                                1
                                                        )
                                                            label = isArabic
                                                                ? "السابق"
                                                                : "Next";

                                                        const isIcon =
                                                            index === 0 ||
                                                            index ===
                                                                reviews.links
                                                                    .length -
                                                                    1;

                                                        return (
                                                            <button
                                                                key={index}
                                                                onClick={() =>
                                                                    handlePageChange(
                                                                        link.url
                                                                    )
                                                                }
                                                                disabled={
                                                                    !link.url ||
                                                                    link.active
                                                                }
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                                                    link.active
                                                                        ? "z-10 bg-brand-purple border-brand-purple text-white cursor-default"
                                                                        : !link.url
                                                                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                } ${
                                                                    index === 0
                                                                        ? "rounded-l-md"
                                                                        : ""
                                                                } ${
                                                                    index ===
                                                                    reviews
                                                                        .links
                                                                        .length -
                                                                        1
                                                                        ? "rounded-r-md"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {isIcon ? (
                                                                    index ===
                                                                    0 ? (
                                                                        isArabic ? (
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronLeft className="h-4 w-4" />
                                                                        )
                                                                    ) : isArabic ? (
                                                                        <ChevronLeft className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )
                                                                ) : (
                                                                    formatNumber(
                                                                        parseInt(
                                                                            label
                                                                        ) || 0,
                                                                        language
                                                                    ) || label
                                                                )}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium mb-1">
                                {t("shop:reviewsSection.noReviewsYet")}
                            </p>
                            <p className="text-sm text-gray-400">
                                {t("shop:reviewsSection.beFirstToReview")}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
