import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge, Select } from '@/Components/ui';
import { Category, PaginatedData } from '@/types/models';
import { Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, CornerDownRight, FolderTree, Layers, CheckCircle, XCircle, Type, Link2, Package, ToggleLeft, Folder, Eye, Hash, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling, useResizableColumns } from '@/hooks';
import { StickyScrollWrapper, ResizableTh, SortIcon, ResetColumnsButton } from '@/Components/admin/ResizableTable';

interface Props {
    categories: PaginatedData<Category>;
    filters: { search?: string; status?: string; per_page?: string; sort?: string; dir?: string };
    statusCounts: { active: number; inactive: number };
    stats?: {
        total: number;
        parents: number;
        subcategories: number;
        active: number;
        inactive: number;
        empty: number;
    };
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

const perPageOptions = ['4', '8', '16', '32', '64', '80'];

const statusOptions = [
    { value: '', label: 'All Status', icon: Layers },
    { value: 'active', label: 'Active', icon: CheckCircle },
    { value: 'inactive', label: 'Inactive', icon: XCircle },
];

const defaultStats = {
    total: 0,
    parents: 0,
    subcategories: 0,
    active: 0,
    inactive: 0,
    empty: 0,
};

export default function CategoriesIndex({ categories, filters, statusCounts, stats: statsProp }: Props) {
    const stats = statsProp ?? defaultStats;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [perPage, setPerPage] = useState(filters.per_page || '16');
    const [sortField, setSortField] = useState(filters.sort || 'name');
    const [sortDir, setSortDir] = useState(filters.dir || 'asc');
    const isFirstRender = useRef(true);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    // Resizable columns configuration
    const resizable = useResizableColumns({
        storageKey: 'admin-categories-table',
        columns: [
            { key: 'name', defaultWidth: 250, minWidth: 150 },
            { key: 'slug', defaultWidth: 200, minWidth: 120 },
            { key: 'products', defaultWidth: 120, minWidth: 80 },
            { key: 'status', defaultWidth: 100, minWidth: 80 },
            { key: 'actions', defaultWidth: 120, minWidth: 100 },
        ],
    });

    const debouncedSearch = useDebounce(search, 300);

    // SPA-style filter function
    const applyFilters = useCallback((
        searchVal: string,
        statusVal: string,
        sortFieldVal: string,
        sortDirVal: string,
        perPageVal: string
    ) => {
        router.get(
            '/admin/categories',
            {
                search: searchVal || undefined,
                status: statusVal || undefined,
                sort: sortFieldVal !== 'name' ? sortFieldVal : undefined,
                dir: sortDirVal !== 'asc' ? sortDirVal : undefined,
                per_page: perPageVal !== '16' ? perPageVal : undefined,
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
        applyFilters(debouncedSearch, status, sortField, sortDir, perPage);
    }, [debouncedSearch, applyFilters]);

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        applyFilters(search, newStatus, sortField, sortDir, perPage);
    };

    // Handle sort toggle on column header click
    const handleSortToggle = (field: string) => {
        let newDir = 'asc';
        if (sortField === field) {
            newDir = sortDir === 'asc' ? 'desc' : 'asc';
        }
        setSortField(field);
        setSortDir(newDir);
        applyFilters(search, status, field, newDir, perPage);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, status, sortField, sortDir, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setSortField('name');
        setSortDir('asc');
        applyFilters('', '', 'name', 'asc', perPage);
    };

    const hasActiveFilters = filters.search || filters.status || (filters.sort && filters.sort !== 'name');

    const handleDelete = (category: Category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(`/admin/categories/${category.id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Categories" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderTree className="h-6 w-6 text-amber-600" />
                        Categories
                    </h1>
                    <Link href="/admin/categories/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Add Category</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4 min-h-[120px] flex flex-col">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5" />
                                Total Categories
                            </p>
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4 min-h-[120px] flex flex-col">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Active
                            </p>
                            <div className="flex-1 flex items-center justify-center gap-2">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.active}
                                </p>
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                    / {stats.total}
                                </span>
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4 min-h-[120px] flex flex-col">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5" />
                                Inactive
                            </p>
                            <div className="flex-1 flex items-center justify-center">
                                <p className={`text-3xl font-bold ${stats.inactive > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                    {stats.inactive}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-4 min-h-[120px] flex flex-col">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Empty (0 products)
                            </p>
                            <div className="flex-1 flex items-center justify-center">
                                <p className={`text-3xl font-bold ${stats.empty > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                    {stats.empty}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative w-full sm:w-1/2">
                                <label htmlFor="categories-search" className="sr-only">Search categories</label>
                                <input
                                    id="categories-search"
                                    name="search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search categories..."
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-purple-600 dark:focus:border-purple-400 outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:ml-auto">
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-dashed border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear All Filters
                                    </button>
                                )}
                                <Select
                                    value={status}
                                    onChange={handleStatusChange}
                                    className="w-full sm:w-44"
                                    placeholder="All Status"
                                    options={statusOptions}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                    {categories.data.map((category) => (
                        <Card key={category.id} className={`dark:bg-gray-800 dark:border-gray-700 ${category.parent_id ? 'ml-4 border-l-4 border-l-gray-300 dark:border-l-gray-600' : ''}`}>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {category.parent_id ? (
                                                <CornerDownRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            ) : (
                                                <Folder className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                            )}
                                            <span className={`truncate ${category.parent_id ? 'text-gray-700 dark:text-gray-300' : 'font-medium text-gray-900 dark:text-white'}`}>
                                                {category.name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{category.slug}</p>
                                    </div>
                                    <Badge variant={category.is_active ? 'success' : 'default'} className="flex-shrink-0">
                                        {category.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                        <Package className="h-4 w-4" />
                                        <span className="tabular-nums">{category.products_count || 0}</span>
                                        <span>products</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link href={`/admin/categories/${category.id}`} preserveScroll>
                                            <Button variant="ghost" size="sm" title="View">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/categories/${category.id}/edit`} preserveScroll>
                                            <Button variant="ghost" size="sm" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(category)}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {categories.data.length === 0 && (
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No categories found
                            </div>
                        </Card>
                    )}
                </div>

                {/* Desktop Table Layout */}
                <Card className="hidden md:block dark:bg-gray-800 dark:border-gray-700">
                    {/* Header bar with reset button */}
                    <div className="flex justify-end items-center px-4 h-10 border-b border-gray-200 dark:border-gray-700">
                        <ResetColumnsButton resizable={resizable} />
                    </div>
                    <StickyScrollWrapper>
                        <table className="w-full table-fixed min-w-[700px]">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <ResizableTh
                                        columnKey="name"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('name')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Type className="h-3.5 w-3.5" />
                                            Name
                                            <SortIcon field="name" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="slug"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('slug')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Link2 className="h-3.5 w-3.5" />
                                            Slug
                                            <SortIcon field="slug" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="products"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('products_count')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <Package className="h-3.5 w-3.5" />
                                            Products
                                            <SortIcon field="products_count" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="status"
                                        resizable={resizable}
                                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        <button
                                            onClick={() => handleSortToggle('is_active')}
                                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <ToggleLeft className="h-3.5 w-3.5" />
                                            Status
                                            <SortIcon field="is_active" currentSortField={sortField} currentSortDir={sortDir as 'asc' | 'desc'} />
                                        </button>
                                    </ResizableTh>
                                    <ResizableTh
                                        columnKey="actions"
                                        resizable={resizable}
                                        className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        isResizable={false}
                                    >
                                        Actions
                                    </ResizableTh>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {categories.data.map((category) => (
                                    <tr key={category.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${category.parent_id ? 'bg-gray-50/50 dark:bg-gray-700/30' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`flex items-center ${category.parent_id ? 'pl-6' : ''}`}>
                                                {category.parent_id ? (
                                                    <CornerDownRight className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                ) : (
                                                    <Folder className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                )}
                                                <span className={category.parent_id ? 'text-gray-700 dark:text-gray-300' : 'font-medium text-gray-900 dark:text-white'}>
                                                    {category.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {category.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="tabular-nums text-gray-900 dark:text-white">{category.products_count || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={category.is_active ? 'success' : 'default'}>
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/admin/categories/${category.id}`} preserveScroll>
                                                    <Button variant="ghost" size="sm" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/categories/${category.id}/edit`} preserveScroll>
                                                    <Button variant="ghost" size="sm" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(category)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </StickyScrollWrapper>
                    {categories.data.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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
                                            <span className="px-2 py-2 text-gray-400 dark:text-gray-500 sm:hidden">...</span>
                                        )}
                                        <Link
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${
                                                link.active
                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                    : link.url
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {pageNum}
                                        </Link>
                                        {showRightEllipsis && (
                                            <span className="px-2 py-2 text-gray-400 dark:text-gray-500 sm:hidden">...</span>
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
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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
                            <label htmlFor="categories-per-page" className="text-sm text-gray-500 dark:text-gray-400">Show:</label>
                            <select
                                id="categories-per-page"
                                name="per_page"
                                value={perPage}
                                onChange={(e) => handlePerPageChange(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 text-sm focus:border-gray-900 dark:focus:border-gray-400 outline-none min-w-[80px]"
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
