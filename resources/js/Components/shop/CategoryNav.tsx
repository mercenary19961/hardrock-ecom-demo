import { Link } from '@inertiajs/react';
import { useLocalized } from '@/hooks/useLocalized';
import { Category } from '@/types/models';
import {
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

interface CategoryNavProps {
    categories: Category[];
    currentSlug?: string;
}

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

// Map category slugs to background colors
const categoryColors: Record<string, string> = {
    'electronics': 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
    'skincare': 'bg-pink-100 text-pink-600 group-hover:bg-pink-200',
    'building-blocks': 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
    'fashion': 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
    'home-kitchen': 'bg-green-100 text-green-600 group-hover:bg-green-200',
    'sports': 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
    'stationery': 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
    'kids': 'bg-rose-100 text-rose-600 group-hover:bg-rose-200',
};

export function CategoryNav({ categories }: CategoryNavProps) {
    const { getCategoryName } = useLocalized();

    return (
        <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => {
                const IconComponent = categoryIcons[category.slug] || ShoppingBag;
                const colorClasses = categoryColors[category.slug] || 'bg-gray-100 text-gray-600 group-hover:bg-gray-200';

                return (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="group flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-purple-200 hover:shadow-md transition-all"
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${colorClasses}`}>
                            <IconComponent className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-brand-purple text-center line-clamp-2 transition-colors">
                            {getCategoryName(category)}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
