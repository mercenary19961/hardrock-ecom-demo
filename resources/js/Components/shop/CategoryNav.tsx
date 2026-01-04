import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '@/hooks/useLocalized';
import { Category } from '@/types/models';

interface CategoryNavProps {
    categories: Category[];
    currentSlug?: string;
}

export function CategoryNav({ categories, currentSlug }: CategoryNavProps) {
    const { t } = useTranslation();
    const { getCategoryName } = useLocalized();

    return (
        <nav className="flex flex-wrap gap-3">
            <Link
                href="/"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    !currentSlug
                        ? 'bg-gradient-to-r from-brand-purple to-brand-purple-600 text-white shadow-lg shadow-brand-purple/25'
                        : 'bg-white text-gray-700 hover:bg-brand-purple-50 hover:text-brand-purple border border-gray-200 hover:border-brand-purple-200'
                }`}
            >
                {t('common:all')}
            </Link>
            {categories.map((category, index) => {
                const isActive = currentSlug === category.slug;
                // Alternate between purple and orange for visual interest
                const accentColor = index % 2 === 0 ? 'purple' : 'orange';
                const activeGradient = accentColor === 'purple'
                    ? 'from-brand-purple to-brand-purple-600 shadow-brand-purple/25'
                    : 'from-brand-orange to-brand-orange-600 shadow-brand-orange/25';
                const hoverStyles = accentColor === 'purple'
                    ? 'hover:bg-brand-purple-50 hover:text-brand-purple hover:border-brand-purple-200'
                    : 'hover:bg-brand-orange-50 hover:text-brand-orange hover:border-brand-orange-200';

                return (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                            isActive
                                ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg`
                                : `bg-white text-gray-700 border border-gray-200 ${hoverStyles}`
                        }`}
                    >
                        {getCategoryName(category)}
                        {category.products_count !== undefined && (
                            <span className={`ms-1.5 text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                                ({category.products_count})
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
