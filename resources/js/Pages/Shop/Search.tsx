import { Head } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { SearchBar } from '@/Components/shop/SearchBar';
import { Product, PaginatedData } from '@/types/models';

interface Props {
    products: PaginatedData<Product>;
    query: string;
}

export default function Search({ products, query }: Props) {
    return (
        <ShopLayout>
            <Head title={query ? `Search: ${query}` : 'Search'} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>
                    <div className="max-w-xl">
                        <SearchBar initialQuery={query} />
                    </div>
                </div>

                {query && (
                    <p className="text-gray-600 mb-6">
                        {products.total} {products.total === 1 ? 'result' : 'results'} for "{query}"
                    </p>
                )}

                <ProductGrid
                    products={products.data}
                    emptyMessage={query ? `No products found for "${query}".` : 'Enter a search term to find products.'}
                />
            </div>
        </ShopLayout>
    );
}
