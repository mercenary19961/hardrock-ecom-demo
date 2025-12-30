import { Link } from '@inertiajs/react';
import { Product } from '@/types/models';
import { formatPrice, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import { Badge } from '@/Components/ui';
import { Star } from 'lucide-react';

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
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const imageUrl = primaryImage
        ? getImageUrl(primaryImage.path, product.id, primaryImage.sort_order)
        : '/images/placeholder.jpg';
    const hasDiscount = product.compare_price && product.compare_price > product.price;

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {hasDiscount && (
                    <Badge variant="danger" className="absolute top-2 left-2 sm:top-3 sm:left-3 text-xs sm:text-sm">
                        -{getDiscountPercentage(product.price, product.compare_price!)}%
                    </Badge>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">Out of Stock</span>
                    </div>
                )}
            </div>
            <div className="p-2 sm:p-4">
                <p className="text-xs text-gray-500 mb-1 hidden sm:block">{product.category?.name}</p>
                <h3 className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
                    {product.name}
                </h3>
                {product.rating_count > 0 && (
                    <div className="mt-1">
                        <StarRating rating={product.average_rating} count={product.rating_count} />
                    </div>
                )}
                <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                    <span className="text-sm sm:text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs sm:text-sm text-gray-400 line-through">
                            {formatPrice(product.compare_price!)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
