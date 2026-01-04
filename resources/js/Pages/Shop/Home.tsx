import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { CategoryNav } from '@/Components/shop/CategoryNav';
import { HeroBanner } from '@/Components/shop/HeroBanner';
import { FeaturedCategorySection } from '@/Components/shop/FeaturedCategorySection';
import { Product, Category } from '@/types/models';
import { ArrowRight, Flame } from 'lucide-react';

interface FeaturedCategory {
    category: Category;
    products: Product[];
}

interface Props {
    saleProducts: Product[];
    categories: Category[];
    featuredCategories: FeaturedCategory[];
}

export default function Home({ saleProducts, categories, featuredCategories }: Props) {
    const { t } = useTranslation();

    // Alternate background colors for featured sections
    const sectionColors = ['bg-white', 'bg-brand-purple-50/30', 'bg-white'];

    return (
        <ShopLayout>
            <Head title={t('common:home')} />

            {/* Hero Banner */}
            <HeroBanner />

            {/* Categories Section with gradient accent */}
            <section className="relative py-12 overflow-hidden">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple-50/50 via-white to-brand-orange-50/30" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{t('common:shopByCategory')}</h2>
                        <div className="h-1 flex-1 max-w-24 bg-gradient-to-r from-brand-purple to-brand-orange rounded-full" />
                    </div>
                    <CategoryNav categories={categories} />
                </div>
            </section>

            {/* Featured Category Sections */}
            {featuredCategories?.map((featured, index) => (
                <FeaturedCategorySection
                    key={featured.category.id}
                    category={featured.category}
                    products={featured.products}
                    bgColor={sectionColors[index % sectionColors.length]}
                    accentColor={index % 2 === 0 ? 'purple' : 'orange'}
                />
            ))}

            {/* Sale Products - Brand Orange Theme */}
            {saleProducts && saleProducts.length > 0 && (
                <section className="relative py-12 overflow-hidden">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-orange-50 via-brand-orange-100/50 to-white" />
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">{t('common:onSale')}</h2>
                                <span className="bg-gradient-to-r from-brand-orange to-brand-orange-600 text-white text-sm font-medium px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-brand-orange/25">
                                    <Flame className="h-4 w-4" />
                                    {t('common:hotDeals')}
                                </span>
                            </div>
                            <Link
                                href="/search?on_sale=1"
                                className="text-brand-orange-600 hover:text-brand-orange-700 font-medium flex items-center gap-1 transition-colors"
                            >
                                {t('common:viewAll')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <ProductGrid products={saleProducts} />
                    </div>
                </section>
            )}

            {/* Demo Banner - Brand Purple Theme */}
            <section className="relative py-16 overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple-900 via-brand-purple-800 to-brand-purple-900" />
                {/* Decorative circles */}
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-purple-400/20 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                        <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
                        <span className="text-white/80 text-sm">Demo Mode</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                        {t('common:demoStore')}
                    </h3>
                    <p className="text-brand-purple-200 max-w-2xl mx-auto mb-6">
                        {t('common:demoDescription')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                            <span className="text-brand-purple-300">Admin:</span>
                            <span className="text-white ml-2">admin@hardrock-co.com / demo1234</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                            <span className="text-brand-purple-300">Customer:</span>
                            <span className="text-white ml-2">customer@hardrock-co.com / demo1234</span>
                        </div>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}
