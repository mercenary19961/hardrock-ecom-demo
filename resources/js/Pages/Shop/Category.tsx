import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { Button, DualRangeSlider } from '@/Components/ui';
import { Product, Category as CategoryType, PaginatedData } from '@/types/models';
import { ChevronRight, ChevronDown, X, Filter, Clock, Tag, Package, Wallet, ArrowUpDown, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type FilterCategory = 'new_arrivals' | 'price' | 'discount' | 'availability';

interface Props {
    category: CategoryType;
    products: PaginatedData<Product>;
    subcategories: CategoryType[];
    sort: string;
    filters: {
        min_price?: number;
        max_price?: number;
        in_stock?: boolean;
        new_arrivals?: boolean;
        below_100?: boolean;
        min_discount?: number;
        price_range?: string;
        has_discount?: boolean;
        top_rated?: boolean;
        popular?: boolean;
    };
    priceRange: {
        min: number;
        max: number;
    };
}

// Collapsible filter section component
function FilterSection({ title, icon: Icon, children, defaultOpen = true }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-200 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{title}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="mt-3">{children}</div>}
        </div>
    );
}

// Checkbox filter item
function FilterCheckbox({ label, checked, onChange, count }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    count?: number;
}) {
    return (
        <label className="flex items-center justify-between py-1.5 cursor-pointer group">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
            </div>
            {count !== undefined && (
                <span className="text-xs text-gray-400">{count}</span>
            )}
        </label>
    );
}

export default function Category({ category, products, subcategories, sort, filters, priceRange }: Props) {
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileSort, setShowMobileSort] = useState(false);
    const [showDesktopSort, setShowDesktopSort] = useState(false);
    const [selectedFilterCategory, setSelectedFilterCategory] = useState<FilterCategory>('new_arrivals');
    const [localFilters, setLocalFilters] = useState({
        min_price: filters.min_price?.toString() || '',
        max_price: filters.max_price?.toString() || '',
        in_stock: filters.in_stock || false,
        new_arrivals: filters.new_arrivals || false,
        below_100: filters.below_100 || false,
        min_discount: filters.min_discount || 0,
    });

    // Slider state for price range
    const [sliderMin, setSliderMin] = useState(filters.min_price || priceRange.min);
    const [sliderMax, setSliderMax] = useState(filters.max_price || priceRange.max);

    const discountOptions = [
        { value: 10, label: '10%+ Off' },
        { value: 20, label: '20%+ Off' },
        { value: 30, label: '30%+ Off' },
        { value: 40, label: '40%+ Off' },
        { value: 50, label: '50%+ Off' },
        { value: 60, label: '60%+ Off' },
        { value: 70, label: '70%+ Off' },
        { value: 80, label: '80%+ Off' },
        { value: 90, label: '90%+ Off' },
    ];

    const sortOptions = [
        { value: 'newest', label: 'Newest Arrivals' },
        { value: 'sale', label: 'Best Deals' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'name', label: 'Name: A to Z' },
    ];

    const filterCategories = [
        { id: 'new_arrivals' as FilterCategory, label: 'New Arrivals', icon: Clock },
        { id: 'price' as FilterCategory, label: 'Price', icon: Wallet },
        { id: 'discount' as FilterCategory, label: 'Discount', icon: Tag },
        { id: 'availability' as FilterCategory, label: 'Availability', icon: Package },
    ];

    const quickFilters = [
        { id: 'under_25', label: 'Up to 25 JOD', param: 'price_range', value: 'under_25' },
        { id: '25_to_50', label: '25 - 50 JOD', param: 'price_range', value: '25_to_50' },
        { id: 'over_50', label: '50+ JOD', param: 'price_range', value: 'over_50' },
        { id: 'has_discount', label: 'On Sale', param: 'has_discount', value: '1' },
        { id: 'top_rated', label: '4+ Stars', param: 'top_rated', value: '1' },
        { id: 'popular', label: 'Popular', param: 'popular', value: '1' },
    ];

    const isQuickFilterActive = (filterId: string) => {
        switch (filterId) {
            case 'under_25':
            case '25_to_50':
            case 'over_50':
                return filters.price_range === filterId;
            case 'has_discount':
                return filters.has_discount === true;
            case 'top_rated':
                return filters.top_rated === true;
            case 'popular':
                return filters.popular === true;
            default:
                return false;
        }
    };

    const toggleQuickFilter = (filter: typeof quickFilters[0]) => {
        const isActive = isQuickFilterActive(filter.id);
        const params: Record<string, string> = { sort, ...buildFilterParams() };

        // Clear any existing price_range if toggling a price filter
        if (filter.param === 'price_range') {
            delete params.price_range;
        }

        if (isActive) {
            // Remove the filter
            delete params[filter.param];
        } else {
            // Add the filter (and remove conflicting ones)
            if (filter.param === 'price_range') {
                // Remove below_100 if setting price_range
                delete params.below_100;
            }
            params[filter.param] = filter.value;
        }

        router.get(`/category/${category.slug}`, params, { preserveState: true, preserveScroll: true });
    };

    const buildFilterParams = () => {
        const params: Record<string, string> = {};
        if (localFilters.min_price) params.min_price = localFilters.min_price;
        if (localFilters.max_price) params.max_price = localFilters.max_price;
        if (localFilters.in_stock) params.in_stock = '1';
        if (localFilters.new_arrivals) params.new_arrivals = '1';
        if (localFilters.below_100) params.below_100 = '1';
        if (localFilters.min_discount > 0) params.min_discount = localFilters.min_discount.toString();
        // Include quick filters from server state
        if (filters.price_range) params.price_range = filters.price_range;
        if (filters.has_discount) params.has_discount = '1';
        if (filters.top_rated) params.top_rated = '1';
        if (filters.popular) params.popular = '1';
        return params;
    };

    const applyFilters = (newFilters?: Partial<typeof localFilters>) => {
        const updatedFilters = newFilters ? { ...localFilters, ...newFilters } : localFilters;
        if (newFilters) setLocalFilters(updatedFilters);

        const params: Record<string, string> = { sort };
        if (updatedFilters.min_price) params.min_price = updatedFilters.min_price;
        if (updatedFilters.max_price) params.max_price = updatedFilters.max_price;
        if (updatedFilters.in_stock) params.in_stock = '1';
        if (updatedFilters.new_arrivals) params.new_arrivals = '1';
        if (updatedFilters.below_100) params.below_100 = '1';
        if (updatedFilters.min_discount > 0) params.min_discount = updatedFilters.min_discount.toString();

        router.get(`/category/${category.slug}`, params, { preserveState: true, preserveScroll: true });
    };

    const handleSortChange = (newSort: string) => {
        router.get(`/category/${category.slug}`, {
            sort: newSort,
            ...buildFilterParams()
        }, { preserveState: true, preserveScroll: true });
        setShowMobileSort(false);
    };

    const handleSliderChange = (min: number, max: number) => {
        setSliderMin(min);
        setSliderMax(max);
    };

    const handleSliderChangeEnd = (min: number, max: number) => {
        const params: Record<string, string> = { sort };
        // Only add price params if they differ from the full range
        if (min > priceRange.min) params.min_price = min.toString();
        if (max < priceRange.max) params.max_price = max.toString();
        if (localFilters.in_stock) params.in_stock = '1';
        if (localFilters.new_arrivals) params.new_arrivals = '1';
        if (localFilters.min_discount > 0) params.min_discount = localFilters.min_discount.toString();
        // Include quick filters from server state
        if (filters.price_range) params.price_range = filters.price_range;
        if (filters.has_discount) params.has_discount = '1';
        if (filters.top_rated) params.top_rated = '1';
        if (filters.popular) params.popular = '1';

        router.get(`/category/${category.slug}`, params, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setLocalFilters({
            min_price: '',
            max_price: '',
            in_stock: false,
            new_arrivals: false,
            below_100: false,
            min_discount: 0,
        });
        setSliderMin(priceRange.min);
        setSliderMax(priceRange.max);
        router.get(`/category/${category.slug}`, { sort }, { preserveState: true, preserveScroll: true });
        setShowMobileFilters(false);
    };

    const hasActiveFilters = filters.min_price || filters.max_price || filters.in_stock ||
        filters.new_arrivals || filters.below_100 || (filters.min_discount && filters.min_discount > 0) ||
        filters.price_range || filters.has_discount || filters.top_rated || filters.popular;

    const activeFilterCount = [
        filters.min_price,
        filters.max_price,
        filters.in_stock,
        filters.new_arrivals,
        filters.below_100,
        filters.min_discount && filters.min_discount > 0,
        filters.price_range,
        filters.has_discount,
        filters.top_rated,
        filters.popular,
    ].filter(Boolean).length;

    // Filter sidebar content (shared between desktop and mobile)
    const FilterContent = () => (
        <>
            {/* New Arrivals */}
            <FilterSection title="New Arrivals" icon={Clock}>
                <FilterCheckbox
                    label="Latest Products"
                    checked={localFilters.new_arrivals}
                    onChange={(checked) => applyFilters({ new_arrivals: checked })}
                />
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price" icon={Wallet}>
                <DualRangeSlider
                    min={priceRange.min}
                    max={priceRange.max}
                    minValue={sliderMin}
                    maxValue={sliderMax}
                    onChange={handleSliderChange}
                    onChangeEnd={handleSliderChangeEnd}
                    step={1}
                    formatValue={(v) => formatPrice(v)}
                />
            </FilterSection>

            {/* Discount */}
            <FilterSection title="Discount" icon={Tag}>
                <div className="space-y-1">
                    {discountOptions.map((option) => (
                        <FilterCheckbox
                            key={option.value}
                            label={option.label}
                            checked={localFilters.min_discount === option.value}
                            onChange={(checked) => applyFilters({ min_discount: checked ? option.value : 0 })}
                        />
                    ))}
                </div>
            </FilterSection>

            {/* Availability */}
            <FilterSection title="Availability" icon={Package}>
                <FilterCheckbox
                    label="In Stock Only"
                    checked={localFilters.in_stock}
                    onChange={(checked) => applyFilters({ in_stock: checked })}
                />
            </FilterSection>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="pt-4">
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                        Clear All Filters
                    </Button>
                </div>
            )}
        </>
    );

    return (
        <ShopLayout>
            <Head title={category.name} />

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
                        {priceRange.min > 0 && priceRange.max > 0 && (
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                                <span className="text-gray-300">Starting from</span>
                                <span className="font-bold">{formatPrice(priceRange.min)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Subcategories Pills */}
            {subcategories.length > 0 && (
                <div className="bg-gray-50 border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                            <Link
                                href={`/category/${category.slug}`}
                                className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium"
                            >
                                All {category.name}
                            </Link>
                            {subcategories.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/category/${sub.slug}`}
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
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-900">Filters</h2>
                                {hasActiveFilters && (
                                    <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <FilterContent />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile Filter & Sort Buttons */}
                        <div className="flex items-center gap-2 mb-4 lg:hidden overflow-x-auto pb-2 scrollbar-hide">
                            {/* Filter Button */}
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Sort Button */}
                            <button
                                onClick={() => setShowMobileSort(true)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowUpDown className="h-3.5 w-3.5" />
                                Sort
                            </button>

                            {/* Quick Filter Chips - Mobile */}
                            {quickFilters.map((filter) => {
                                const isActive = isQuickFilterActive(filter.id);
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => toggleQuickFilter(filter)}
                                        className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Desktop: Product Count, Sort, and Quick Filters in one row */}
                        <div className="hidden lg:flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            <span className="text-sm text-gray-500 flex-shrink-0">
                                {products.total} {products.total === 1 ? 'product' : 'products'}
                            </span>
                            {/* Custom Sort Dropdown */}
                            <div className="relative flex-shrink-0">
                                <button
                                    onClick={() => setShowDesktopSort(!showDesktopSort)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-gray-500">Sort:</span>
                                    <span>{sortOptions.find(opt => opt.value === sort)?.label}</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showDesktopSort ? 'rotate-180' : ''}`} />
                                </button>
                                {showDesktopSort && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDesktopSort(false)} />
                                        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px]">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleSortChange(option.value);
                                                        setShowDesktopSort(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                        sort === option.value
                                                            ? 'bg-gray-100 text-gray-900 font-medium'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {sort === option.value && <Check className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            {quickFilters.map((filter) => {
                                const isActive = isQuickFilterActive(filter.id);
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => toggleQuickFilter(filter)}
                                        className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                {filters.new_arrivals && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        New Arrivals
                                        <button onClick={() => applyFilters({ new_arrivals: false })} className="ml-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.below_100 && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        Below 100 JOD
                                        <button onClick={() => applyFilters({ below_100: false })} className="ml-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.min_price && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        Min: {formatPrice(filters.min_price)}
                                        <button onClick={() => { setLocalFilters({...localFilters, min_price: ''}); applyFilters({ min_price: '' }); }} className="ml-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.max_price && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        Max: {formatPrice(filters.max_price)}
                                        <button onClick={() => { setLocalFilters({...localFilters, max_price: ''}); applyFilters({ max_price: '' }); }} className="ml-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.min_discount && filters.min_discount > 0 && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {filters.min_discount}%+ Off
                                        <button onClick={() => applyFilters({ min_discount: 0 })} className="ml-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.in_stock && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        In Stock Only
                                        <button onClick={() => applyFilters({ in_stock: false })} className="ml-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

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
                    </div>
                </div>

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

            {/* Mobile Filter Bottom Sheet (Amazon-style) */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
                    <div className="absolute bottom-0 left-0 right-0 top-16 bg-white rounded-t-2xl shadow-xl flex flex-col animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h2 className="font-semibold text-gray-900 text-lg">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Two-panel layout */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left panel - Filter categories */}
                            <div className="w-2/5 bg-gray-50 border-r overflow-y-auto">
                                {filterCategories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = selectedFilterCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedFilterCategory(cat.id)}
                                            className={`w-full flex items-center gap-2 px-4 py-4 text-left text-sm transition-colors ${
                                                isActive
                                                    ? 'bg-white border-l-2 border-gray-900 font-medium text-gray-900'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right panel - Filter options */}
                            <div className="w-3/5 overflow-y-auto p-4">
                                {/* New Arrivals Options */}
                                {selectedFilterCategory === 'new_arrivals' && (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => applyFilters({ new_arrivals: true })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                localFilters.new_arrivals
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>Latest Products</span>
                                            {localFilters.new_arrivals && <Check className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => applyFilters({ new_arrivals: false })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                !localFilters.new_arrivals
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>All Products</span>
                                            {!localFilters.new_arrivals && <Check className="h-4 w-4" />}
                                        </button>
                                    </div>
                                )}

                                {/* Price Options */}
                                {selectedFilterCategory === 'price' && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-gray-500 mb-2">Price Range</p>
                                        <DualRangeSlider
                                            min={priceRange.min}
                                            max={priceRange.max}
                                            minValue={sliderMin}
                                            maxValue={sliderMax}
                                            onChange={handleSliderChange}
                                            onChangeEnd={handleSliderChangeEnd}
                                            step={1}
                                            formatValue={(v) => formatPrice(v)}
                                        />
                                    </div>
                                )}

                                {/* Discount Options */}
                                {selectedFilterCategory === 'discount' && (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => applyFilters({ min_discount: 0 })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                localFilters.min_discount === 0
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>All Items</span>
                                            {localFilters.min_discount === 0 && <Check className="h-4 w-4" />}
                                        </button>
                                        {discountOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => applyFilters({ min_discount: option.value })}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                    localFilters.min_discount === option.value
                                                        ? 'bg-gray-900 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <span>{option.label}</span>
                                                {localFilters.min_discount === option.value && <Check className="h-4 w-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Availability Options */}
                                {selectedFilterCategory === 'availability' && (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => applyFilters({ in_stock: false })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                !localFilters.in_stock
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>All Items</span>
                                            {!localFilters.in_stock && <Check className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => applyFilters({ in_stock: true })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                localFilters.in_stock
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>In Stock Only</span>
                                            {localFilters.in_stock && <Check className="h-4 w-4" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom bar with results button */}
                        <div className="border-t bg-white px-4 py-3 flex items-center justify-between">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Clear All
                                </button>
                            )}
                            <Button
                                onClick={() => setShowMobileFilters(false)}
                                className={hasActiveFilters ? '' : 'w-full'}
                            >
                                Show {products.total} {products.total === 1 ? 'Result' : 'Results'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sort Bottom Sheet */}
            {showMobileSort && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSort(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h2 className="font-semibold text-gray-900 text-lg">Sort By</h2>
                            <button onClick={() => setShowMobileSort(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Sort Options */}
                        <div className="p-4 space-y-1">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSortChange(option.value)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors ${
                                        sort === option.value
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {sort === option.value && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </ShopLayout>
    );
}
