import { useState, useEffect } from "react";
import { Head, Link, Deferred } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import ShopLayout from "@/Layouts/ShopLayout";
import { ProductGrid } from "@/Components/shop/ProductGrid";
import { ProductGridSkeleton } from "@/Components/shop/ProductGridSkeleton";
import { QuantitySelector } from "@/Components/shop/QuantitySelector";
import { ReviewSection } from "@/Components/shop/ReviewSection";
import { Button, Badge, LazyImage } from "@/Components/ui";
import { useCart } from "@/contexts/CartContext";
import { useLocalized } from "@/hooks/useLocalized";
import {
    Product as ProductType,
    Breadcrumb,
    Review,
    PaginatedData,
} from "@/types/models";
import {
    formatPrice,
    formatNumber,
    getImageUrl,
    getDiscountPercentage,
} from "@/lib/utils";
import { ChevronRight, ShoppingCart, Check, Bell, Star } from "lucide-react";

function StarRating({
    rating,
    count,
    language,
}: {
    rating: number;
    count: number;
    language: string;
}) {
    if (count === 0 || rating == null) return null;

    const ratingValue = Number(rating) || 0;

    const isArabic = language === "ar";
    const formattedRating = new Intl.NumberFormat(
        isArabic ? "ar-JO" : "en-JO",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }
    ).format(ratingValue);

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                    const fill = Math.min(
                        1,
                        Math.max(0, ratingValue - (star - 1))
                    );
                    return (
                        <div key={star} className="relative h-5 w-5">
                            {/* Background empty star */}
                            <Star className="absolute inset-0 h-full w-full fill-gray-200 text-gray-200" />
                            {/* Precisely filled portion */}
                            {fill > 0 && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{
                                        width: `${fill * 100}%`,
                                        left: 0,
                                    }}
                                >
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <span className="text-sm text-gray-600">
                {formattedRating} ({formatNumber(count, language)}{" "}
                {isArabic
                    ? count >= 3 && count <= 9
                        ? "تقييمات"
                        : "تقييم"
                    : count === 1
                    ? "review"
                    : "reviews"}
                )
            </span>
        </div>
    );
}

interface Props {
    product: ProductType;
    reviews?: PaginatedData<Review>;
    ratingDistribution?: Record<number, number>;
    relatedProducts?: ProductType[];
    breadcrumbs: Breadcrumb[];
    canReview?: boolean;
    userReview?: Review | null;
    auth?: { user: { id: number; name: string; email: string } | null };
}

// Default empty paginated data for deferred props
const defaultReviews: PaginatedData<Review> = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    links: [],
};

function ProductContent({
    product,
    reviews,
    ratingDistribution,
    relatedProducts,
    breadcrumbs,
    canReview,
    userReview,
    auth,
}: Props) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const { addToCart, loading } = useCart();
    const {
        getProductName,
        getProductDescription,
        getProductShortDescription,
        getCategoryName,
    } = useLocalized();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [added, setAdded] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    // Check if product has sizes and colors
    const hasSizes =
        product.available_sizes && product.available_sizes.length > 0;
    const hasColors =
        product.available_colors && product.available_colors.length > 0;
    const hasVariantStock =
        hasColors && hasSizes && product.variant_stock && Object.keys(product.variant_stock).length > 0;
    const sizeStock = product.size_stock || {};
    const variantStock = product.variant_stock || {};

    // Helper to create variant key
    const createVariantKey = (colorName: string, size: string): string => {
        return `${colorName.toLowerCase().replace(/\s+/g, '_')}_${size}`;
    };

    // Get stock for selected variant (color+size), or size only, or total stock
    const getAvailableStock = () => {
        // If using variant stock system (colors + sizes)
        if (hasVariantStock && selectedColor && selectedSize) {
            const key = createVariantKey(selectedColor, selectedSize);
            return variantStock[key] || 0;
        }
        // If only sizes (no colors or color not selected)
        if (hasSizes && selectedSize) {
            // Check variant stock first if color is selected
            if (hasVariantStock && selectedColor) {
                const key = createVariantKey(selectedColor, selectedSize);
                return variantStock[key] || 0;
            }
            return sizeStock[selectedSize] || 0;
        }
        return product.stock;
    };

    // Check if a specific size is in stock (considering selected color if variant system)
    const isSizeInStock = (size: string): boolean => {
        if (hasVariantStock && selectedColor) {
            const key = createVariantKey(selectedColor, size);
            return (variantStock[key] || 0) > 0;
        }
        return (sizeStock[size] || 0) > 0;
    };

    // Check if a specific color has any stock (across all sizes)
    const isColorInStock = (colorName: string): boolean => {
        if (hasVariantStock && hasSizes) {
            return product.available_sizes!.some(size => {
                const key = createVariantKey(colorName, size);
                return (variantStock[key] || 0) > 0;
            });
        }
        return true; // If no variant stock, assume in stock
    };

    // Get localized content
    const productName = getProductName(product);
    const productDescription = getProductDescription(product);
    const productShortDescription = getProductShortDescription(product);
    const categoryName = product.category
        ? getCategoryName(product.category)
        : "";

    // Check localStorage for previously requested notifications
    const storageKey = `notify_product_${product.id}`;
    const [notifyRequested, setNotifyRequested] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(storageKey) === "true";
        }
        return false;
    });

    const handleNotifyRequest = () => {
        setNotifyRequested(true);
        localStorage.setItem(storageKey, "true");
    };

    // Filter images based on selected color
    // If no color selected, show all images
    // If color selected, show images tagged with that color OR images with no color tag (universal images)
    const allImages = product.images || [];
    const images = selectedColor
        ? allImages.filter(img => img.color === selectedColor || img.color === null)
        : allImages;

    // Reset selected image when color changes (to avoid showing invalid index)
    useEffect(() => {
        setSelectedImage(0);
    }, [selectedColor]);

    const hasDiscount =
        product.compare_price && product.compare_price > product.price;

    const handleAddToCart = async () => {
        try {
            await addToCart(product.id, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (error) {
            console.error("Failed to add to cart");
        }
    };

    return (
        <>
            <Head title={productName} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden">
                    <Link
                        href="/"
                        className="hover:text-gray-900 flex-shrink-0"
                    >
                        {t("common:home")}
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                        <span
                            key={crumb.slug}
                            className="flex items-center gap-2 min-w-0"
                        >
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            {index === breadcrumbs.length - 1 ? (
                                <span
                                    className="text-gray-900 truncate max-w-[150px] sm:max-w-none cursor-default"
                                    title={crumb.name}
                                >
                                    {crumb.name}
                                </span>
                            ) : (
                                <Link
                                    href={`/category/${crumb.slug}`}
                                    className="hover:text-gray-900 whitespace-nowrap flex-shrink-0"
                                >
                                    {crumb.name}
                                </Link>
                            )}
                        </span>
                    ))}
                </nav>

                {/* Product Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Images */}
                    <div>
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                            {images[selectedImage] ? (
                                <img
                                    src={getImageUrl(
                                        images[selectedImage].path,
                                        product.id,
                                        images[selectedImage].sort_order
                                    )}
                                    alt={productName}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    decoding="async"
                                    fetchPriority="high"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-400">
                                        No image available
                                    </span>
                                </div>
                            )}
                        </div>
                        {images.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                                            selectedImage === index
                                                ? "border-brand-purple"
                                                : "border-gray-200 hover:border-gray-400"
                                        }`}
                                    >
                                        <LazyImage
                                            src={getImageUrl(
                                                image.path,
                                                product.id,
                                                image.sort_order
                                            )}
                                            alt={image.alt_text || productName}
                                            className="w-full h-full"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        {product.category && (
                            <div className="mb-4">
                                <Link
                                    href={`/category/${product.category.slug}`}
                                    className="text-sm text-gray-500 hover:text-gray-900"
                                >
                                    {categoryName}
                                </Link>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {productName}
                        </h1>

                        {product.rating_count > 0 && (
                            <div className="mb-4">
                                <StarRating
                                    rating={product.average_rating}
                                    count={product.rating_count}
                                    language={language}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(product.price, language)}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-xl text-gray-400 line-through">
                                        {formatPrice(
                                            product.compare_price!,
                                            language
                                        )}
                                    </span>
                                    <Badge variant="danger">
                                        {t("common:savePercent", {
                                            percent: getDiscountPercentage(
                                                product.price,
                                                product.compare_price!
                                            ),
                                        })}
                                    </Badge>
                                </>
                            )}
                        </div>

                        <div className="mb-6">
                            {product.stock > 0 ? (
                                <Badge variant="success">
                                    {t("common:inStock")}
                                </Badge>
                            ) : (
                                <Badge variant="danger">
                                    {t("common:outOfStock")}
                                </Badge>
                            )}
                        </div>

                        {productShortDescription && (
                            <p className="text-gray-600 mb-6">
                                {productShortDescription}
                            </p>
                        )}

                        {/* Color Selector */}
                        {hasColors && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {t("shop:selectColor")}
                                    </h3>
                                    {selectedColor && (
                                        <span className="text-sm text-gray-500">
                                            {selectedColor}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {product.available_colors!.map((color) => {
                                        const colorInStock = isColorInStock(color.name);
                                        const isSelected = selectedColor === color.name;

                                        return (
                                            <button
                                                key={color.name}
                                                onClick={() =>
                                                    colorInStock &&
                                                    setSelectedColor(color.name)
                                                }
                                                disabled={!colorInStock}
                                                title={color.name}
                                                className={`
                                                    w-10 h-10 rounded-full border-2 transition-all relative
                                                    ${
                                                        isSelected
                                                            ? "border-brand-purple ring-2 ring-brand-purple ring-offset-2"
                                                            : !colorInStock
                                                            ? "border-gray-200 opacity-40 cursor-not-allowed"
                                                            : "border-gray-300 hover:border-brand-purple"
                                                    }
                                                `}
                                                style={{ backgroundColor: color.hex }}
                                            >
                                                {!colorInStock && (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <span className="w-full h-0.5 bg-gray-400 rotate-45 absolute" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!selectedColor && (
                                    <p className="mt-2 text-sm text-amber-600">
                                        {t("shop:pleaseSelectColor")}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Size Selector */}
                        {hasSizes && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {t("shop:selectSize")}
                                    </h3>
                                    {selectedSize && (
                                        <span className="text-sm text-gray-500">
                                            {t("shop:inStockCount", {
                                                count: getAvailableStock(),
                                            })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.available_sizes!.map((size) => {
                                        const inStock = isSizeInStock(size);
                                        const isSelected = selectedSize === size;

                                        return (
                                            <button
                                                key={size}
                                                onClick={() =>
                                                    inStock &&
                                                    setSelectedSize(size)
                                                }
                                                disabled={!inStock}
                                                className={`
                                                    min-w-[3rem] px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all
                                                    ${
                                                        isSelected
                                                            ? "border-brand-purple bg-brand-purple text-white"
                                                            : !inStock
                                                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                                            : "border-gray-300 bg-white text-gray-700 hover:border-brand-purple"
                                                    }
                                                `}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!selectedSize && (
                                    <p className="mt-2 text-sm text-amber-600">
                                        {t("shop:pleaseSelectSize")}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Add to Cart or Notify Me */}
                        {product.stock > 0 ? (
                            <div className="flex items-center gap-4 mb-8">
                                <QuantitySelector
                                    quantity={quantity}
                                    onChange={setQuantity}
                                    max={getAvailableStock()}
                                />
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={
                                        loading ||
                                        added ||
                                        (hasSizes === true && selectedSize === null) ||
                                        (hasColors === true && selectedColor === null)
                                    }
                                    size="lg"
                                    className="flex-1"
                                >
                                    {added ? (
                                        <>
                                            <Check className="me-2 h-5 w-5" />
                                            {t("common:addedToCart")}
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="me-2 h-5 w-5" />
                                            {t("common:addToCart")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <Button
                                    onClick={handleNotifyRequest}
                                    disabled={notifyRequested}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    {notifyRequested ? (
                                        <>
                                            <Check className="me-2 h-5 w-5" />
                                            {t("shop:requestSubmitted")}
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="me-2 h-5 w-5" />
                                            {t("shop:notifyMe")}
                                        </>
                                    )}
                                </Button>
                                {notifyRequested && (
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        {t("shop:notifyMeDescription")}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {productDescription && (
                            <div className="mt-8 pt-8 border-t">
                                <h2 className="text-lg font-semibold mb-4">
                                    {t("shop:description")}
                                </h2>
                                <div className="prose prose-sm text-gray-600 whitespace-pre-line">
                                    {productDescription}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section - Deferred Loading */}
                <Deferred
                    data="reviews"
                    fallback={
                        <div className="mt-12 animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-gray-100 rounded-lg p-4">
                                        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    }
                >
                    <ReviewSection
                        product={product}
                        reviews={reviews ?? defaultReviews}
                        ratingDistribution={ratingDistribution ?? {}}
                        canReview={canReview ?? false}
                        userReview={userReview ?? null}
                        isAuthenticated={!!auth?.user}
                    />
                </Deferred>

                {/* Related Products - Deferred Loading */}
                <Deferred
                    data="relatedProducts"
                    fallback={
                        <section className="mt-12">
                            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
                            <ProductGridSkeleton count={4} />
                        </section>
                    }
                >
                    {relatedProducts && relatedProducts.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {t("shop:relatedProducts")}
                            </h2>
                            <ProductGrid products={relatedProducts} />
                        </section>
                    )}
                </Deferred>
            </div>
        </>
    );
}

export default function Product({
    product,
    reviews,
    ratingDistribution,
    relatedProducts,
    breadcrumbs,
    canReview,
    userReview,
    auth,
}: Props) {
    return (
        <ShopLayout>
            <ProductContent
                product={product}
                reviews={reviews}
                ratingDistribution={ratingDistribution}
                relatedProducts={relatedProducts}
                breadcrumbs={breadcrumbs}
                canReview={canReview}
                userReview={userReview}
                auth={auth}
            />
        </ShopLayout>
    );
}
