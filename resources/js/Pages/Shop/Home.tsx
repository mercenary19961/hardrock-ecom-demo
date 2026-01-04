import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ShopLayout from '@/Layouts/ShopLayout';
import { ProductGrid } from '@/Components/shop/ProductGrid';
import { CategoryNav } from '@/Components/shop/CategoryNav';
import { HeroBanner } from '@/Components/shop/HeroBanner';
import { FeaturedCategorySection } from '@/Components/shop/FeaturedCategorySection';
import { Product, Category } from '@/types/models';
import { ArrowRight } from 'lucide-react';

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
    const sectionColors = ['bg-white', 'bg-gray-50', 'bg-white'];

    return (
        <ShopLayout>
            <Head title={t('common:home')} />

            {/* Hero Banner */}
            <HeroBanner />

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('common:shopByCategory')}</h2>
                <CategoryNav categories={categories} />
            </section>

            {/* Featured Category Sections */}
            {featuredCategories?.map((featured, index) => (
                <FeaturedCategorySection
                    key={featured.category.id}
                    category={featured.category}
                    products={featured.products}
                    bgColor={sectionColors[index % sectionColors.length]}
                />
            ))}

            {/* Sale Products */}
            {saleProducts && saleProducts.length > 0 && (
                <section className="bg-red-50 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">{t('common:onSale')}</h2>
                                <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                                    {t('common:hotDeals')}
                                </span>
                            </div>
                            <Link
                                href="/search?on_sale=1"
                                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                            >
                                {t('common:viewAll')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <ProductGrid products={saleProducts} />
                    </div>
                </section>
            )}

            {/* Demo Banner */}
            <section className="bg-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {t('common:demoStore')}
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        {t('common:demoDescription')}
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Admin: admin@hardrock-co.com / demo1234</p>
                        <p>Customer: customer@hardrock-co.com / demo1234</p>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}
