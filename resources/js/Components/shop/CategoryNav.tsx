import { Link } from '@inertiajs/react';
import { Category } from '@/types/models';

interface CategoryNavProps {
    categories: Category[];
    currentSlug?: string;
}

export function CategoryNav({ categories, currentSlug }: CategoryNavProps) {
    return (
        <nav className="flex flex-wrap gap-2">
            <Link
                href="/"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !currentSlug
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                All
            </Link>
            {categories.map((category) => (
                <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        currentSlug === category.slug
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {category.name}
                    {category.products_count !== undefined && (
                        <span className="ml-1 text-xs opacity-70">({category.products_count})</span>
                    )}
                </Link>
            ))}
        </nav>
    );
}
