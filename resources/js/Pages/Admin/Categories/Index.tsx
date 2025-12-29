import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Category, PaginatedData } from '@/types/models';
import { Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks';

interface Props {
    categories: PaginatedData<Category>;
    filters: { search?: string; status?: string; per_page?: string };
    statusCounts: { active: number; inactive: number };
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const perPageOptions = ['10', '15', '25', '50', '100'];

export default function CategoriesIndex({ categories, filters, statusCounts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');
    const isFirstRender = useRef(true);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    const debouncedSearch = useDebounce(search, 300);

    // SPA-style filter function
    const applyFilters = useCallback((searchVal: string, statusVal: string, perPageVal: string) => {
        router.get(
            '/admin/categories',
            {
                search: searchVal || undefined,
                status: statusVal || undefined,
                per_page: perPageVal !== '15' ? perPageVal : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    }, []);

    // Auto-filter when debounced search changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilters(debouncedSearch, status, perPage);
    }, [debouncedSearch, applyFilters]);

    const handleStatusFilter = (newStatus: string) => {
        const statusValue = newStatus === 'all' ? '' : newStatus;
        setStatus(statusValue);
        applyFilters(search, statusValue, perPage);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, status, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        applyFilters('', '', perPage);
    };

    const hasActiveFilters = filters.search || filters.status;

    const handleDelete = (category: Category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(`/admin/categories/${category.id}`);
        }
    };

    const totalCategories = statusCounts.active + statusCounts.inactive;

    return (
        <AdminLayout>
            <Head title="Categories" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <Link href="/admin/categories/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Add Category</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </Link>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleStatusFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            !filters.status
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                        <span className="ml-1 opacity-70">({totalCategories})</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('active')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filters.status === 'active'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Active
                        <span className="ml-1 opacity-70">({statusCounts.active})</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('inactive')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filters.status === 'inactive'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Inactive
                        <span className="ml-1 opacity-70">({statusCounts.inactive})</span>
                    </button>
                </div>

                {/* Search */}
                <Card>
                    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <label htmlFor="categories-search" className="sr-only">Search categories</label>
                            <input
                                id="categories-search"
                                name="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search categories..."
                                autoComplete="off"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-900 outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="hidden md:table-cell text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Products
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {categories.data.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">
                                                {category.parent_id && '— '}
                                                {category.name}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-gray-500">
                                            {category.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="tabular-nums text-gray-900">{category.products_count || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={category.is_active ? 'success' : 'default'}>
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/categories/${category.id}/edit`} preserveScroll>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(category)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {categories.data.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No categories found
                        </div>
                    )}
                </Card>

                {/* Pagination and Per Page */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {categories.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={categories.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    categories.links[0].url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>

                            {/* Page Numbers */}
                            {categories.links.slice(1, -1).map((link, index) => {
                                const pageNum = index + 1;
                                const currentPage = categories.current_page;
                                const lastPage = categories.last_page;

                                // On small screens: show first, current, last, and neighbors of current
                                const showOnMobile = pageNum === 1 ||
                                    pageNum === lastPage ||
                                    pageNum === currentPage ||
                                    pageNum === currentPage - 1 ||
                                    pageNum === currentPage + 1;

                                // Show ellipsis markers
                                const showLeftEllipsis = pageNum === currentPage - 1 && currentPage > 3;
                                const showRightEllipsis = pageNum === currentPage + 1 && currentPage < lastPage - 2;

                                return (
                                    <span key={index} className={!showOnMobile ? 'hidden sm:inline' : ''}>
                                        {showLeftEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 sm:hidden">...</span>
                                        )}
                                        <Link
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${
                                                link.active
                                                    ? 'bg-gray-900 text-white'
                                                    : link.url
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {pageNum}
                                        </Link>
                                        {showRightEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 sm:hidden">...</span>
                                        )}
                                    </span>
                                );
                            })}

                            {/* Next Button */}
                            <Link
                                href={categories.links[categories.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    categories.links[categories.links.length - 1].url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}
                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center gap-2">
                            <label htmlFor="categories-per-page" className="text-sm text-gray-500">Show:</label>
                            <select
                                id="categories-per-page"
                                name="per_page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-gray-900 outline-none min-w-[80px]"
                            >
                                {perPageOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
