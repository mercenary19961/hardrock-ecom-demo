import { Product } from '@/types/models';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    products: Product[];
    emptyMessage?: string;
    priorityCount?: number; // Number of products to load eagerly (above-the-fold)
}

export function ProductGrid({
    products,
    emptyMessage = 'No products found.',
    priorityCount = 4, // First 4 products load immediately (typically visible on first screen)
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product, index) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < priorityCount}
                />
            ))}
        </div>
    );
}
