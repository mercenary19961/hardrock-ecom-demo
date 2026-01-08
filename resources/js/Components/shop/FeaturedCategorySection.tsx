import { useRef } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Smartphone,
    Sparkles,
    ToyBrick,
    Watch,
    ChefHat,
    Trophy,
    GraduationCap,
    Baby,
    ShoppingBag
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product, Category } from '@/types/models';
import { useLocalized } from '@/hooks/useLocalized';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImageUrl } from '@/lib/utils';

// Map category slugs to icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'electronics': Smartphone,
    'skincare': Sparkles,
    'building-blocks': ToyBrick,
    'fashion': Watch,
    'home-kitchen': ChefHat,
    'sports': Trophy,
    'stationery': GraduationCap,
    'kids': Baby,
};

// All featured category icons use brand purple
const iconColor = 'text-brand-purple';

interface Props {
    category: Category;
    products: Product[];
    variant?: 'default' | 'highlight' | 'grid-cards';
    bgColor?: string;
    accentColor?: 'purple' | 'orange';
}

// Mini product card for grid-cards variant (image + title only)
function MiniProductCard({ product }: { product: Product }) {
    const { getProductName } = useLocalized();
    const mainImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const imageUrl = mainImage
        ? getImageUrl(mainImage.path, product.id, mainImage.sort_order)
        : getImageUrl(null, product.id, 0);

    const productName = getProductName(product);

    return (
        <Link href={`/product/${product.slug}`} className="group block">
            <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2 border border-gray-200 group-hover:border-gray-300 transition-colors">
                <img
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <p
                className="text-sm text-gray-900 group-hover:text-gray-500 truncate transition-colors"
                title={productName}
            >
                {productName}
            </p>
        </Link>
    );
}

// Grid card component - contains 4 products in 2x2 grid
function ProductGridCard({
    title,
    products,
    linkHref,
    linkText,
    accentColor = 'purple'
}: {
    title: string;
    products: Product[];
    linkHref: string;
    linkText: string;
    accentColor?: 'purple' | 'orange';
}) {
    const linkColorClass = accentColor === 'purple'
        ? 'text-brand-purple hover:text-brand-purple-700'
        : 'text-brand-orange hover:text-brand-orange-700';

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                {products.slice(0, 4).map((product) => (
                    <MiniProductCard key={product.id} product={product} />
                ))}
            </div>
            <Link
                href={linkHref}
                className={`text-sm font-medium ${linkColorClass} transition-colors`}
            >
                {linkText}
            </Link>
        </div>
    );
}

export function FeaturedCategorySection({ category, products, variant = 'default', bgColor, accentColor = 'purple' }: Props) {
    const { t } = useTranslation();
    const { getCategoryName, getCategoryDescription } = useLocalized();
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    // Get the icon for this category
    const CategoryIcon = categoryIcons[category.slug] || ShoppingBag;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Color configurations based on accent
    const colorConfig = {
        purple: {
            button: 'border-brand-purple-200 text-brand-purple hover:bg-brand-purple-50 hover:border-brand-purple-300',
            link: 'text-brand-purple hover:text-brand-purple-700',
            accent: 'from-brand-purple to-brand-purple-600',
        },
        orange: {
            button: 'border-brand-orange-200 text-brand-orange hover:bg-brand-orange-50 hover:border-brand-orange-300',
            link: 'text-brand-orange hover:text-brand-orange-700',
            accent: 'from-brand-orange to-brand-orange-600',
        },
    };

    const colors = colorConfig[accentColor];

    // Grid cards variant - 2 cards with 4 products each
    if (variant === 'grid-cards') {
        if (products.length === 0) return null;

        const sectionBg = bgColor || 'bg-gray-50';
        const firstCardProducts = products.slice(0, 4);
        const secondCardProducts = products.slice(4, 8);

        // Get subcategories for card titles (if available)
        const subcategories = category.children || [];
        const firstCardTitle = subcategories[0]
            ? getCategoryName(subcategories[0])
            : t('common:featured') + ' ' + getCategoryName(category);
        const secondCardTitle = subcategories[1]
            ? getCategoryName(subcategories[1])
            : t('common:topRated') + ' ' + getCategoryName(category);

        return (
            <section className={`${sectionBg} py-12`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <CategoryIcon className={`h-7 w-7 ${iconColor}`} />
                            <h2 className="text-2xl font-bold text-gray-900">
                                {getCategoryName(category)}
                            </h2>
                        </div>
                        <Link
                            href={`/category/${category.slug}`}
                            className={`flex items-center gap-2 font-medium transition-colors group ${colors.link}`}
                        >
                            <span>{t('common:viewAll')}</span>
                            <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                        </Link>
                    </div>

                    {/* Two cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {firstCardProducts.length > 0 && (
                            <ProductGridCard
                                title={firstCardTitle}
                                products={firstCardProducts}
                                linkHref={subcategories[0] ? `/category/${subcategories[0].slug}` : `/category/${category.slug}`}
                                linkText={t('common:seeMore')}
                                accentColor={accentColor}
                            />
                        )}
                        {secondCardProducts.length > 0 && (
                            <ProductGridCard
                                title={secondCardTitle}
                                products={secondCardProducts}
                                linkHref={subcategories[1] ? `/category/${subcategories[1].slug}` : `/category/${category.slug}`}
                                linkText={t('common:seeMore')}
                                accentColor={accentColor}
                            />
                        )}
                    </div>
                </div>
            </section>
        );
    }

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        const maxScroll = scrollWidth - clientWidth;

        const isMobile = window.innerWidth < 768;
        const productWidth = isMobile ? container.clientWidth / 2 : container.clientWidth / 4;
        const scrollAmount = productWidth * 2;

        // Determine actual direction based on RTL
        const isScrollingRight = isRTL ? direction === 'left' : direction === 'right';
        const isScrollingLeft = !isScrollingRight;

        // Check if at boundaries and need to loop
        const atStart = isRTL ? scrollLeft >= -1 : scrollLeft <= 1;
        const atEnd = isRTL ? Math.abs(scrollLeft) >= maxScroll - 1 : scrollLeft >= maxScroll - 1;

        if (isScrollingLeft && atStart) {
            // At start, going left -> jump to end
            container.scrollTo({
                left: isRTL ? -maxScroll : maxScroll,
                behavior: 'smooth',
            });
        } else if (isScrollingRight && atEnd) {
            // At end, going right -> jump to start
            container.scrollTo({
                left: 0,
                behavior: 'smooth',
            });
        } else {
            // Normal scroll
            const scrollDirection = isRTL
                ? direction === 'left' ? scrollAmount : -scrollAmount
                : direction === 'left' ? -scrollAmount : scrollAmount;

            container.scrollBy({
                left: scrollDirection,
                behavior: 'smooth',
            });
        }
    };

    if (products.length === 0) return null;

    const displayProducts = products.slice(0, 8);
    const sectionBg = bgColor || (variant === 'highlight' ? 'bg-gray-50' : 'bg-white');

    return (
        <section className={`${sectionBg} py-12`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <CategoryIcon className={`h-7 w-7 ${iconColor}`} />
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('common:featured')} {getCategoryName(category)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scroll('left')}
                            className={`p-2 rounded-full border transition-colors ${colors.button}`}
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className={`p-2 rounded-full border transition-colors ${colors.button}`}
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        {/* View All Link */}
                        <Link
                            href={`/category/${category.slug}`}
                            className={`hidden sm:flex items-center gap-2 font-medium transition-colors group ml-2 ${colors.link}`}
                        >
                            <span>{t('common:viewAll')}</span>
                            <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Category Description */}
                {category.description && (
                    <p className="text-gray-600 mb-6 -mt-4">
                        {getCategoryDescription(category)}
                    </p>
                )}

                {/* Products Carousel */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scroll-smooth custom-scrollbar"
                >
                    {displayProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex-shrink-0 w-[calc(50%-8px)] md:w-[calc(25%-18px)]"
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {/* Mobile View All Link */}
                <div className="sm:hidden mt-4 text-center">
                    <Link
                        href={`/category/${category.slug}`}
                        className={`inline-flex items-center gap-2 font-medium ${colors.link}`}
                    >
                        <span>{t('common:viewAll')}</span>
                        <ArrowIcon className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
