import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types/models';
import { formatPrice, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import { Badge } from '@/Components/ui';
import { Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useLocalized } from '@/hooks/useLocalized';

interface ProductCardProps {
    product: Product;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
    if (count === 0) return null;

    const getStarFill = (starPosition: number) => {
        if (rating >= starPosition) return 'full';
        if (rating >= starPosition - 0.5) return 'half';
        return 'empty';
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                    const fill = getStarFill(star);
                    return (
                        <div key={star} className="relative h-3 w-3 sm:h-3.5 sm:w-3.5">
                            {/* Background empty star */}
                            <Star className="absolute inset-0 h-full w-full fill-gray-200 text-gray-200" />
                            {/* Filled portion */}
                            {fill !== 'empty' && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: fill === 'half' ? '50%' : '100%' }}
                                >
                                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <span className="text-xs text-gray-500">({count})</span>
        </div>
    );
}

export function ProductCard({ product }: ProductCardProps) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const { getProductName, getCategoryName } = useLocalized();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const { isInWishlist, toggleWishlist } = useWishlist();

    const isWishlisted = isInWishlist(product.id);
    const images = product.images || [];
    const hasMultipleImages = images.length > 1;

    const currentImage = images[currentImageIndex] || images[0];
    const imageUrl = currentImage
        ? getImageUrl(currentImage.path, product.id, currentImage.sort_order)
        : getImageUrl(null, product.id, 0);

    const hasDiscount = product.compare_price && Number(product.compare_price) > Number(product.price);

    const handlePrevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
            <div
                className="relative aspect-square overflow-hidden bg-gray-50"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                {/* Wishlist Heart Button */}
                <button
                    onClick={handleWishlistClick}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart
                        className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                            isWishlisted
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600 hover:text-red-500'
                        }`}
                    />
                </button>

                {/* Discount Badge */}
                {hasDiscount && (
                    <Badge variant="danger" className="absolute top-2 left-2 sm:top-3 sm:left-3 text-xs sm:text-sm">
                        -{getDiscountPercentage(product.price, product.compare_price!)}%
                    </Badge>
                )}

                {/* Image Navigation Arrows */}
                {hasMultipleImages && isHovered && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-700" />
                        </button>

                        {/* Image Dots Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        index === currentImageIndex
                                            ? 'bg-gray-900'
                                            : 'bg-gray-400'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Out of Stock Overlay */}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">{t('common:outOfStock')}</span>
                    </div>
                )}
            </div>
            <div className="p-2 sm:p-4">
                <p className="text-xs text-gray-500 mb-1 hidden sm:block">
                    {product.category ? getCategoryName(product.category) : ''}
                </p>
                <h3 className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
                    {getProductName(product)}
                </h3>
                {product.rating_count > 0 && (
                    <div className="mt-1">
                        <StarRating rating={product.average_rating} count={product.rating_count} />
                    </div>
                )}
                <div className="mt-1 sm:mt-2 flex items-center gap-2">
                    <span className="text-sm sm:text-base text-gray-600">
                        {formatPrice(product.price, language)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm sm:text-base text-gray-400 line-through">
                            {formatPrice(product.compare_price!, language)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
