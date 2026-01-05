import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

interface SearchBarProps {
    initialQuery?: string;
    placeholder?: string;
}

export function SearchBar({ initialQuery = '', placeholder }: SearchBarProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState(initialQuery);
    const searchPlaceholder = placeholder || t('nav:searchPlaceholder');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.get('/search', { q: query.trim() });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-md">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 bg-white shadow-sm
                         hover:border-gray-300 focus:border-brand-purple-500 focus:ring-2 focus:ring-brand-purple-500/20
                           focus:outline-none text-sm transition"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </form>
    );
}
