import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';

interface SearchBarProps {
    initialQuery?: string;
    placeholder?: string;
}

export function SearchBar({ initialQuery = '', placeholder = 'Search products...' }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);

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
                placeholder={placeholder}
                className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </form>
    );
}
