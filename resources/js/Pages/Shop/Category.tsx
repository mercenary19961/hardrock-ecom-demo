import { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { Button, DualRangeSlider } from '@/Components/ui';
import { Product, Category as CategoryType, PaginatedData } from '@/types/models';
import { ChevronRight, ChevronLeft, ChevronDown, X, Filter, Clock, Tag, Package, Wallet, ArrowUpDown, Check } from 'lucide-react';
import { formatPrice, formatNumber } from '@/lib/utils';
import { useLocalized } from '@/hooks/useLocalized';

// Map category slugs to banner image names
const categoryBannerMap: Record<string, string> = {
    'electronics': 'category-electronics-hero',
    'skincare': 'category-skincare-hero',
    'building-blocks': 'category-building-blocks-hero',
    'fashion': 'category-fashion-accessories-hero',
    'home-kitchen': 'category-home-kitchen-hero',
    'sports': 'category-sports-outdoors-hero',
    'stationery': 'category-books-stationery-hero',
    'kids': 'category-baby-kids-hero',
};

type FilterCategory = 'new_arrivals' | 'price' | 'discount' | 'availability';

interface Props {
    category: CategoryType;
    products: PaginatedData<Product>;
    subcategories: CategoryType[];
    parentCategory?: CategoryType | null;
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

export default function Category({ category, products, subcategories, parentCategory, sort, filters, priceRange }: Props) {
    const { t, i18n } = useTranslation();
    const { getCategoryName, getCategoryDescription } = useLocalized();
    const language = i18n.language;

    // Determine if we're viewing a subcategory (has parent) or a parent category
    const isSubcategory = !!parentCategory;
    const displayParentCategory = parentCategory || category;

    // Get the banner image for the category (use parent category for subcategories)
    const bannerCategorySlug = displayParentCategory.slug;
    const bannerBaseName = categoryBannerMap[bannerCategorySlug];
    const bannerImage = bannerBaseName
        ? `/images/banners/categories/${bannerBaseName}-${language}.webp`
        : null;
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileSort, setShowMobileSort] = useState(false);
    const [showDesktopSort, setShowDesktopSort] = useState(false);
    const subcategoriesRef = useRef<HTMLDivElement>(null);

    // Scroll subcategories left/right
    const scrollSubcategories = (direction: 'left' | 'right') => {
        if (subcategoriesRef.current) {
            const scrollAmount = 200;
            subcategoriesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };
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
        { value: 10, label: t('shop:filterLabels.discountOff', { percent: formatNumber(10, language) }) },
        { value: 20, label: t('shop:filterLabels.discountOff', { percent: formatNumber(20, language) }) },
        { value: 30, label: t('shop:filterLabels.discountOff', { percent: formatNumber(30, language) }) },
        { value: 40, label: t('shop:filterLabels.discountOff', { percent: formatNumber(40, language) }) },
        { value: 50, label: t('shop:filterLabels.discountOff', { percent: formatNumber(50, language) }) },
        { value: 60, label: t('shop:filterLabels.discountOff', { percent: formatNumber(60, language) }) },
        { value: 70, label: t('shop:filterLabels.discountOff', { percent: formatNumber(70, language) }) },
    ];

    const sortOptions = [
        { value: 'newest', label: t('shop:sortOptions.newest') },
        { value: 'sale', label: t('shop:sortOptions.sale') },
        { value: 'price_low', label: t('shop:sortOptions.priceLow') },
        { value: 'price_high', label: t('shop:sortOptions.priceHigh') },
        { value: 'name', label: t('shop:sortOptions.name') },
    ];

    const filterCategories = [
        { id: 'new_arrivals' as FilterCategory, label: t('shop:filterCategories.newArrivals'), icon: Clock },
        { id: 'price' as FilterCategory, label: t('shop:filterCategories.price'), icon: Wallet },
        { id: 'availability' as FilterCategory, label: t('shop:filterCategories.availability'), icon: Package },
        { id: 'discount' as FilterCategory, label: t('shop:filterCategories.discount'), icon: Tag },
    ];

    const quickFilters = [
        { id: 'under_25', label: t('shop:quickFilters.under25'), param: 'price_range', value: 'under_25' },
        { id: '25_to_50', label: t('shop:quickFilters.25to50'), param: 'price_range', value: '25_to_50' },
        { id: 'over_50', label: t('shop:quickFilters.over50'), param: 'price_range', value: 'over_50' },
        { id: 'has_discount', label: t('shop:quickFilters.onSale'), param: 'has_discount', value: '1' },
        { id: 'top_rated', label: t('shop:quickFilters.topRated'), param: 'top_rated', value: '1' },
        { id: 'popular', label: t('shop:quickFilters.popular'), param: 'popular', value: '1' },
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

    const removeFilter = (filterKey: string) => {
        const params: Record<string, string> = { sort };

        // Build params from all current filters except the one being removed
        if (filters.min_price && filterKey !== 'min_price') params.min_price = filters.min_price.toString();
        if (filters.max_price && filterKey !== 'max_price') params.max_price = filters.max_price.toString();
        if (filters.in_stock && filterKey !== 'in_stock') params.in_stock = '1';
        if (filters.new_arrivals && filterKey !== 'new_arrivals') params.new_arrivals = '1';
        if (filters.below_100 && filterKey !== 'below_100') params.below_100 = '1';
        if (filters.min_discount && filters.min_discount > 0 && filterKey !== 'min_discount') params.min_discount = filters.min_discount.toString();
        if (filters.price_range && filterKey !== 'price_range') params.price_range = filters.price_range;
        if (filters.has_discount && filterKey !== 'has_discount') params.has_discount = '1';
        if (filters.top_rated && filterKey !== 'top_rated') params.top_rated = '1';
        if (filters.popular && filterKey !== 'popular') params.popular = '1';

        // Update local state for the removed filter
        if (filterKey === 'min_price') {
            setLocalFilters(prev => ({ ...prev, min_price: '' }));
            setSliderMin(priceRange.min);
        } else if (filterKey === 'max_price') {
            setLocalFilters(prev => ({ ...prev, max_price: '' }));
            setSliderMax(priceRange.max);
        } else if (filterKey === 'in_stock') {
            setLocalFilters(prev => ({ ...prev, in_stock: false }));
        } else if (filterKey === 'new_arrivals') {
            setLocalFilters(prev => ({ ...prev, new_arrivals: false }));
        } else if (filterKey === 'below_100') {
            setLocalFilters(prev => ({ ...prev, below_100: false }));
        } else if (filterKey === 'min_discount') {
            setLocalFilters(prev => ({ ...prev, min_discount: 0 }));
        }

        router.get(`/category/${category.slug}`, params, { preserveState: true, preserveScroll: true });
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
            <FilterSection title={t('shop:filterCategories.newArrivals')} icon={Clock}>
                <FilterCheckbox
                    label={t('shop:filterLabels.latestProducts')}
                    checked={localFilters.new_arrivals}
                    onChange={(checked) => applyFilters({ new_arrivals: checked })}
                />
            </FilterSection>

            {/* Price */}
            <FilterSection title={t('shop:filterCategories.price')} icon={Wallet}>
                <DualRangeSlider
                    min={priceRange.min}
                    max={priceRange.max}
                    minValue={sliderMin}
                    maxValue={sliderMax}
                    onChange={handleSliderChange}
                    onChangeEnd={handleSliderChangeEnd}
                    step={1}
                    formatValue={(v) => formatPrice(v, language)}
                />
            </FilterSection>

            {/* Availability */}
            <FilterSection title={t('shop:filterCategories.availability')} icon={Package}>
                <FilterCheckbox
                    label={t('shop:filterLabels.inStockOnly')}
                    checked={localFilters.in_stock}
                    onChange={(checked) => applyFilters({ in_stock: checked })}
                />
            </FilterSection>

            {/* Discount */}
            <FilterSection title={t('shop:filterCategories.discount')} icon={Tag}>
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

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="pt-4">
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                        {t('shop:clearFilters')}
                    </Button>
                </div>
            )}
        </>
    );

    return (
        <ShopLayout>
            <Head title={getCategoryName(category)} />

            {/* Hero Banner */}
            <div className="relative bg-white overflow-hidden">
                {/* Mobile gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white md:hidden" />
                {/* Desktop background image */}
                {bannerImage && (
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
                        style={{ backgroundImage: `url(${bannerImage})` }}
                    />
                )}
                {/* Fallback gradient if no banner (desktop only) */}
                {!bannerImage && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white hidden md:block" />
                )}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                            <Link href="/" className="hover:text-gray-900 transition-colors">{t('shop:hero.home')}</Link>
                            <ChevronRight className="h-4 w-4" />
                            {parentCategory ? (
                                <>
                                    <Link href={`/category/${parentCategory.slug}`} className="hover:text-gray-900 transition-colors">
                                        {getCategoryName(parentCategory)}
                                    </Link>
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="text-gray-900 font-medium">{getCategoryName(category)}</span>
                                </>
                            ) : (
                                <span className="text-gray-900 font-medium">{getCategoryName(category)}</span>
                            )}
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-gray-900">
                            {getCategoryName(category)}
                        </h1>
                        {getCategoryDescription(category) && (
                            <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
                                {getCategoryDescription(category)}
                            </p>
                        )}
                        {priceRange.min > 0 && priceRange.max > 0 && (
                            <div className="flex items-center gap-2 bg-gray-900 text-white rounded-full px-4 py-2 w-fit">
                                <span className="text-gray-300">{t('shop:hero.startingFrom')}</span>
                                <span className="font-bold">{formatPrice(priceRange.min, language)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Subcategories Section */}
            {subcategories.length > 0 && (
                <div className="bg-white border-b border-gray-200 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        {/* Left scroll arrow */}
                        <button
                            onClick={() => scrollSubcategories('left')}
                            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white shadow-md rounded-full text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all lg:hidden"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        {/* Right scroll arrow */}
                        <button
                            onClick={() => scrollSubcategories('right')}
                            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white shadow-md rounded-full text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all lg:hidden"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <div
                            ref={subcategoriesRef}
                            className="flex items-center justify-start lg:justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide mx-8 lg:mx-0">
                            {/* "All" button - links to parent category when viewing subcategory */}
                            <Link
                                href={`/category/${displayParentCategory.slug}`}
                                preserveScroll
                                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                    !isSubcategory
                                        ? 'text-brand-purple'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <span>{t('shop:subcategories.all', { category: getCategoryName(displayParentCategory) })}</span>
                                {!isSubcategory && (
                                    <span className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full text-xs">{formatNumber(products.total, language)}</span>
                                )}
                                {/* Underline indicator */}
                                {!isSubcategory && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple"></span>
                                )}
                            </Link>
                            {subcategories.map((sub) => {
                                const isCurrentSubcategory = isSubcategory && sub.id === category.id;
                                return (
                                    <Link
                                        key={sub.id}
                                        href={`/category/${sub.slug}`}
                                        preserveScroll
                                        className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                            isCurrentSubcategory
                                                ? 'text-brand-purple'
                                                : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <span>{getCategoryName(sub)}</span>
                                        {isCurrentSubcategory && (
                                            <span className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full text-xs">{formatNumber(products.total, language)}</span>
                                        )}
                                        {/* Underline indicator */}
                                        {isCurrentSubcategory && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple"></span>
                                        )}
                                    </Link>
                                );
                            })}
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
                                <h2 className="font-semibold text-gray-900">{t('shop:filters')}</h2>
                                {hasActiveFilters && (
                                    <span className="bg-brand-purple text-white text-xs px-2 py-0.5 rounded-full">
                                        {formatNumber(activeFilterCount, language)}
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
                                {t('shop:filters')}
                                {activeFilterCount > 0 && (
                                    <span className="bg-brand-purple text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {formatNumber(activeFilterCount, language)}
                                    </span>
                                )}
                            </button>

                            {/* Sort Button */}
                            <button
                                onClick={() => setShowMobileSort(true)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowUpDown className="h-3.5 w-3.5" />
                                {t('shop:sort')}
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
                                                ? 'bg-brand-purple text-white'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Desktop: Product Count, Sort, and Quick Filters in one row */}
                        <div className="hidden lg:flex items-center gap-3 mb-6">
                            <span className="text-sm text-gray-500 flex-shrink-0">
                                {formatNumber(products.total, language)} {products.total === 1 ? t('shop:product') : t('shop:products')}
                            </span>
                            {/* Custom Sort Dropdown */}
                            <div className="relative flex-shrink-0 z-30">
                                <button
                                    onClick={() => setShowDesktopSort(!showDesktopSort)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-gray-500">{t('shop:sort')}:</span>
                                    <span>{sortOptions.find(opt => opt.value === sort)?.label}</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showDesktopSort ? 'rotate-180' : ''}`} />
                                </button>
                                {showDesktopSort && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowDesktopSort(false)} />
                                        <div className="absolute top-full left-0 mt-2 z-30 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[200px]">
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
                            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                                {quickFilters.map((filter) => {
                                    const isActive = isQuickFilterActive(filter.id);
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => toggleQuickFilter(filter)}
                                            className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                                isActive
                                                    ? 'bg-brand-purple text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                {filters.new_arrivals && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {t('shop:activeFilters.newArrivals')}
                                        <button onClick={() => removeFilter('new_arrivals')} className="ms-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.below_100 && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {t('shop:activeFilters.below100')}
                                        <button onClick={() => removeFilter('below_100')} className="ms-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.min_price && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {t('shop:activeFilters.min', { price: formatPrice(filters.min_price, language) })}
                                        <button onClick={() => removeFilter('min_price')} className="ms-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.max_price && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {t('shop:activeFilters.max', { price: formatPrice(filters.max_price, language) })}
                                        <button onClick={() => removeFilter('max_price')} className="ms-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.min_discount && filters.min_discount > 0 && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {t('shop:activeFilters.discountOff', { percent: formatNumber(filters.min_discount, language) })}
                                        <button onClick={() => removeFilter('min_discount')} className="ms-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.in_stock && (
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {t('shop:activeFilters.inStockOnly')}
                                        <button onClick={() => removeFilter('in_stock')} className="ms-1 hover:text-gray-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1.5 text-sm font-medium border border-brand-slate text-brand-slate rounded-lg hover:bg-brand-slate hover:text-white transition-colors"
                                >
                                    {t('shop:clearAll')}
                                </button>
                            </div>
                        )}

                        {/* Products Grid */}
                        <ProductGrid
                            products={products.data}
                            emptyMessage={t('shop:noProductsMatch')}
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
                                                ? 'bg-brand-slate text-white'
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
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('shop:cta.needHelp')}</h2>
                    <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                        {t('shop:cta.helpDescription')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://wa.me/962798525524"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            {t('shop:cta.chatWhatsApp')}
                        </a>
                        <Link
                            href="/"
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            {t('shop:cta.browseAll')}
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
                            <h2 className="font-semibold text-gray-900 text-lg">{t('shop:filters')}</h2>
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
                                                    ? 'bg-white border-l-2 border-brand-slate font-medium text-brand-slate'
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
                                                    ? 'bg-brand-slate text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>{t('shop:filterLabels.latestProducts')}</span>
                                            {localFilters.new_arrivals && <Check className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => applyFilters({ new_arrivals: false })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                !localFilters.new_arrivals
                                                    ? 'bg-brand-slate text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>{t('shop:filterLabels.allProducts')}</span>
                                            {!localFilters.new_arrivals && <Check className="h-4 w-4" />}
                                        </button>
                                    </div>
                                )}

                                {/* Price Options */}
                                {selectedFilterCategory === 'price' && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-gray-500 mb-2">{t('shop:priceRange')}</p>
                                        <DualRangeSlider
                                            min={priceRange.min}
                                            max={priceRange.max}
                                            minValue={sliderMin}
                                            maxValue={sliderMax}
                                            onChange={handleSliderChange}
                                            onChangeEnd={handleSliderChangeEnd}
                                            step={1}
                                            formatValue={(v) => formatPrice(v, language)}
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
                                                    ? 'bg-brand-slate text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>{t('shop:filterLabels.allItems')}</span>
                                            {localFilters.min_discount === 0 && <Check className="h-4 w-4" />}
                                        </button>
                                        {discountOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => applyFilters({ min_discount: option.value })}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                    localFilters.min_discount === option.value
                                                        ? 'bg-brand-slate text-white'
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
                                                    ? 'bg-brand-slate text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>{t('shop:filterLabels.allItems')}</span>
                                            {!localFilters.in_stock && <Check className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => applyFilters({ in_stock: true })}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                                                localFilters.in_stock
                                                    ? 'bg-brand-slate text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>{t('shop:filterLabels.inStockOnly')}</span>
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
                                    className="px-4 py-2 text-sm font-medium border border-brand-slate text-brand-slate rounded-lg hover:bg-brand-slate hover:text-white transition-colors"
                                >
                                    {t('shop:clearAll')}
                                </button>
                            )}
                            <Button
                                onClick={() => setShowMobileFilters(false)}
                                className={hasActiveFilters ? '' : 'w-full'}
                            >
                                {products.total === 1
                                    ? t('shop:showResult', { count: formatNumber(products.total, language) as unknown as number })
                                    : t('shop:showResults', { count: formatNumber(products.total, language) as unknown as number })
                                }
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
                            <h2 className="font-semibold text-gray-900 text-lg">{t('shop:sortBy')}</h2>
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
                                            ? 'bg-brand-slate text-white'
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
