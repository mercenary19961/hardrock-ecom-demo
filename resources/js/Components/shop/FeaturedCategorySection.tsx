import { useRef } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product, Category } from '@/types/models';
import { useLocalized } from '@/hooks/useLocalized';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
    category: Category;
    products: Product[];
    variant?: 'default' | 'highlight';
    bgColor?: string;
    accentColor?: 'purple' | 'orange';
}

export function FeaturedCategorySection({ category, products, variant = 'default', bgColor, accentColor = 'purple' }: Props) {
    const { t } = useTranslation();
    const { getCategoryName, getCategoryDescription } = useLocalized();
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

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
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('common:featured')} {getCategoryName(category)}
                        </h2>
                        <div className={`hidden sm:block h-1 w-12 bg-gradient-to-r ${colors.accent} rounded-full`} />
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
