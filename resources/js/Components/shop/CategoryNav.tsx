import { Link } from '@inertiajs/react';
import { useLocalized } from '@/hooks/useLocalized';
import { Category } from '@/types/models';
import { LazyImage } from '@/Components/ui';

interface CategoryNavProps {
    categories: Category[];
    currentSlug?: string;
}

// Map category slugs to background images
const categoryImages: Record<string, string> = {
    'electronics': '/images/home_mini/ELECTRONICS@2x.webp',
    'skincare': '/images/home_mini/SKINCARE@2x.webp',
    'building-blocks': '/images/home_mini/BLOCKS@2x.webp',
    'fashion': '/images/home_mini/FASHION@2x.webp',
    'home-kitchen': '/images/home_mini/HOME&KITCHEN@2x.webp',
    'sports': '/images/home_mini/SPORT@2x.webp',
    'stationery': '/images/home_mini/STATIONARY@2x.webp',
    'kids': '/images/home_mini/KIDS@2x.webp',
};

export function CategoryNav({ categories }: CategoryNavProps) {
    const { getCategoryName } = useLocalized();

    return (
        <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => {
                // Use custom uploaded image if available, otherwise fall back to default
                const bgImage = category.image
                    ? `/storage/${category.image}`
                    : categoryImages[category.slug];

                return (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    >
                        {/* Category image card */}
                        <div className="relative w-full aspect-square rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:shadow-brand-purple/20 overflow-hidden transition-all duration-300">
                            {bgImage ? (
                                <LazyImage
                                    src={bgImage}
                                    alt={getCategoryName(category)}
                                    className="w-full h-full"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand-purple/10 to-brand-purple-400/20" />
                            )}
                        </div>
                        {/* Category name below the card */}
                        <span className="text-sm font-medium text-gray-700 group-hover:text-brand-purple text-center line-clamp-2 transition-colors duration-300">
                            {getCategoryName(category)}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
