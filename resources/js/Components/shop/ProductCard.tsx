import { Link } from '@inertiajs/react';
import { Product } from '@/types/models';
import { formatPrice, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import { Badge } from '@/Components/ui';

interface ProductCardProps {
    product: Product;
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
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {hasDiscount && (
                    <Badge variant="danger" className="absolute top-3 left-3">
                        -{getDiscountPercentage(product.price, product.compare_price!)}%
                    </Badge>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">Out of Stock</span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-500 mb-1">{product.category?.name}</p>
                <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
                    {product.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.compare_price!)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
