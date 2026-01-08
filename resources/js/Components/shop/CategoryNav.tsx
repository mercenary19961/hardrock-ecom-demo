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

// Brand colors for glassmorphism effect
const brandStyle = {
    bg: 'from-brand-purple/10 to-brand-purple-400/20',
    icon: 'text-brand-orange group-hover:text-brand-orange-600',
    glow: 'group-hover:shadow-brand-purple/30'
};

export function CategoryNav({ categories }: CategoryNavProps) {
    const { getCategoryName } = useLocalized();

    return (
        <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => {
                const IconComponent = categoryIcons[category.slug] || ShoppingBag;

                return (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md shadow-sm hover:shadow-lg ${brandStyle.glow} transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                    >
                        {/* Glassmorphism icon container */}
                        <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${brandStyle.bg} backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                            {/* Inner glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <IconComponent className={`w-7 h-7 relative z-10 transition-colors duration-300 ${brandStyle.icon}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-black text-center line-clamp-2 transition-colors duration-300">
                            {getCategoryName(category)}
                        </span>
                        {/* Subtle bottom accent line */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-orange group-hover:w-1/2 transition-all duration-300 rounded-full" />
                    </Link>
                );
            })}
        </nav>
    );
}
