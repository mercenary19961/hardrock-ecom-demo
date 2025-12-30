import { Product } from '@/types/models';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    products: Product[];
    emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = 'No products found.' }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
