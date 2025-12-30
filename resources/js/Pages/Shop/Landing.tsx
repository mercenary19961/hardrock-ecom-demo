import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { Select, Button, Input } from '@/Components/ui';
import { Product, Category as CategoryType, PaginatedData } from '@/types/models';
import { ChevronRight, Filter, X, SlidersHorizontal, Tag, Sparkles, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Props {
    category: CategoryType;
    products: PaginatedData<Product>;
    subcategories: CategoryType[];
    sort: string;
    filters: {
        min_price?: number;
        max_price?: number;
        in_stock?: boolean;
        on_sale?: boolean;
    };
    priceRange: {
        min: number;
        max: number;
    };
}

export default function Landing({ category, products, subcategories, sort, filters, priceRange }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        min_price: filters.min_price?.toString() || '',
        max_price: filters.max_price?.toString() || '',
        in_stock: filters.in_stock || false,
        on_sale: filters.on_sale || false,
    });

    const handleSortChange = (newSort: string) => {
        router.get(`/promo/${category.slug}`, {
            sort: newSort,
            ...buildFilterParams()
        }, { preserveState: true });
    };

    const buildFilterParams = () => {
        const params: Record<string, string | boolean> = {};
        if (localFilters.min_price) params.min_price = localFilters.min_price;
        if (localFilters.max_price) params.max_price = localFilters.max_price;
        if (localFilters.in_stock) params.in_stock = '1';
        if (localFilters.on_sale) params.on_sale = '1';
        return params;
    };

    const applyFilters = () => {
        router.get(`/promo/${category.slug}`, {
            sort,
            ...buildFilterParams()
        }, { preserveState: true });
        setShowFilters(false);
    };

    const clearFilters = () => {
        setLocalFilters({
            min_price: '',
            max_price: '',
            in_stock: false,
            on_sale: false,
        });
        router.get(`/promo/${category.slug}`, { sort }, { preserveState: true });
        setShowFilters(false);
    };

    const hasActiveFilters = filters.min_price || filters.max_price || filters.in_stock || filters.on_sale;

    const quickFilters = [
        { key: 'on_sale', label: 'On Sale', icon: Tag, active: localFilters.on_sale },
        { key: 'in_stock', label: 'In Stock Only', icon: Package, active: localFilters.in_stock },
    ];

    return (
        <ShopLayout>
            <Head title={`${category.name} - Special Offers`} />

            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-white">{category.name}</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="text-lg sm:text-xl text-gray-300 mb-6 leading-relaxed">
                                {category.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                                <Sparkles className="h-5 w-5 text-yellow-400" />
                                <span className="font-medium">{products.total} Products</span>
                            </div>
                            {priceRange.min > 0 && priceRange.max > 0 && (
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                                    <span className="text-gray-300">From</span>
                                    <span className="font-bold">{formatPrice(priceRange.min)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subcategories Pills */}
            {subcategories.length > 0 && (
                <div className="bg-gray-50 border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                            <Link
                                href={`/promo/${category.slug}`}
                                className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium"
                            >
                                All {category.name}
                            </Link>
                            {subcategories.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/promo/${sub.slug}`}
                                    className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                >
                                    {sub.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Filters & Sort Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Filter Pills */}
                        {quickFilters.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => {
                                    const newFilters = { ...localFilters, [filter.key]: !filter.active };
                                    setLocalFilters(newFilters);
                                    router.get(`/promo/${category.slug}`, {
                                        sort,
                                        min_price: newFilters.min_price || undefined,
                                        max_price: newFilters.max_price || undefined,
                                        in_stock: newFilters.in_stock ? '1' : undefined,
                                        on_sale: newFilters.on_sale ? '1' : undefined,
                                    }, { preserveState: true });
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    filter.active
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <filter.icon className="h-4 w-4" />
                                {filter.label}
                            </button>
                        ))}

                        {/* More Filters Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                hasActiveFilters
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Price Range
                            {hasActiveFilters && (
                                <span className="bg-white text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    !
                                </span>
                            )}
                        </button>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </button>
                        )}
                    </div>

                    <Select
                        value={sort}
                        onChange={handleSortChange}
                        className="w-full sm:w-48"
                        options={[
                            { value: 'newest', label: 'Newest Arrivals' },
                            { value: 'sale', label: 'Best Deals' },
                            { value: 'price_low', label: 'Price: Low to High' },
                            { value: 'price_high', label: 'Price: High to Low' },
                            { value: 'name', label: 'Name: A to Z' },
                        ]}
                    />
                </div>

                {/* Expanded Filter Panel */}
                {showFilters && (
                    <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Price Range</h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Min Price (JOD)</label>
                                <Input
                                    type="number"
                                    value={localFilters.min_price}
                                    onChange={(e) => setLocalFilters({ ...localFilters, min_price: e.target.value })}
                                    placeholder={priceRange.min.toString()}
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Max Price (JOD)</label>
                                <Input
                                    type="number"
                                    value={localFilters.max_price}
                                    onChange={(e) => setLocalFilters({ ...localFilters, max_price: e.target.value })}
                                    placeholder={priceRange.max.toString()}
                                    min={0}
                                />
                            </div>
                            <div className="sm:col-span-2 flex items-end gap-3">
                                <Button onClick={applyFilters} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button onClick={clearFilters} variant="outline">
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
                        <span className="text-gray-500">Active filters:</span>
                        {filters.min_price && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                                Min: {formatPrice(filters.min_price)}
                            </span>
                        )}
                        {filters.max_price && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                                Max: {formatPrice(filters.max_price)}
                            </span>
                        )}
                        {filters.in_stock && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">In Stock Only</span>
                        )}
                        {filters.on_sale && (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">On Sale</span>
                        )}
                    </div>
                )}

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        Showing <span className="font-medium text-gray-900">{products.data.length}</span> of{' '}
                        <span className="font-medium text-gray-900">{products.total}</span> products
                    </p>
                </div>

                {/* Products Grid */}
                <ProductGrid
                    products={products.data}
                    emptyMessage="No products match your filters. Try adjusting your criteria."
                />

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                        {products.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'bg-gray-900 text-white'
                                        : link.url
                                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12 text-white text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">Need Help Choosing?</h2>
                    <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                        Our team is ready to help you find the perfect product. Contact us for personalized recommendations.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://wa.me/962798525524"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Chat on WhatsApp
                        </a>
                        <Link
                            href="/"
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Browse All Products
                        </Link>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
