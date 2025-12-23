import { Head, Link, router } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { Product, Category as CategoryType, Breadcrumb, PaginatedData } from '@/types/models';
import { ChevronRight } from 'lucide-react';

interface Props {
    category: CategoryType;
    products: PaginatedData<Product>;
    subcategories: CategoryType[];
    breadcrumbs: Breadcrumb[];
    sort: string;
}

export default function Category({ category, products, subcategories, breadcrumbs, sort }: Props) {
    const handleSortChange = (newSort: string) => {
        router.get(`/category/${category.slug}`, { sort: newSort }, { preserveState: true });
    };

    return (
        <ShopLayout>
            <Head title={category.name} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-gray-900">Home</Link>
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.slug} className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" />
                            {index === breadcrumbs.length - 1 ? (
                                <span className="text-gray-900">{crumb.name}</span>
                            ) : (
                                <Link href={`/category/${crumb.slug}`} className="hover:text-gray-900">
                                    {crumb.name}
                                </Link>
                            )}
                        </span>
                    ))}
                </nav>

                {/* Category Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
                    {category.description && (
                        <p className="text-gray-600">{category.description}</p>
                    )}
                </div>

                {/* Subcategories */}
                {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {subcategories.map((sub) => (
                            <Link
                                key={sub.id}
                                href={`/category/${sub.slug}`}
                                className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                {sub.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Sort & Filter */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        {products.total} {products.total === 1 ? 'product' : 'products'}
                    </p>
                    <select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                    >
                        <option value="newest">Newest</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="name">Name</option>
                    </select>
                </div>

                {/* Products Grid */}
                <ProductGrid
                    products={products.data}
                    emptyMessage="No products found in this category."
                />

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {products.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-4 py-2 rounded-lg text-sm ${
                                    link.active
                                        ? 'bg-gray-900 text-white'
                                        : link.url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
