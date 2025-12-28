import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge } from '@/Components/ui';
import { Product, Category, PaginatedData } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
    products: PaginatedData<Product>;
    categories: Category[];
    filters: { search?: string; category?: string; status?: string };
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

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const isFirstRender = useRef(true);

    const debouncedSearch = useDebounce(search, 300);

    // SPA-style filter function
    const applyFilters = useCallback((searchVal: string, categoryVal: string, statusVal: string) => {
        router.get(
            '/admin/products',
            {
                search: searchVal || undefined,
                category: categoryVal || undefined,
                status: statusVal || undefined,
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
        applyFilters(debouncedSearch, category, status);
    }, [debouncedSearch, applyFilters]);

    // Instant filter for dropdowns
    const handleCategoryChange = (value: string) => {
        setCategory(value);
        applyFilters(search, value, status);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        applyFilters(search, category, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        applyFilters('', '', '');
    };

    const hasActiveFilters = filters.search || filters.category || filters.status;

    const handleDelete = (product: Product) => {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            router.delete(`/admin/products/${product.id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Products" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <Link href="/admin/products/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <div className="p-4 flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={handleClearFilters}>
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
                                        Product
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
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
                                {products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        SKU: {product.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {product.category?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">
                                                {formatPrice(product.price)}
                                            </div>
                                            {product.compare_price && (
                                                <div className="text-sm text-gray-400 line-through">
                                                    {formatPrice(product.compare_price)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={
                                                    product.stock === 0
                                                        ? 'danger'
                                                        : product.stock <= 10
                                                        ? 'warning'
                                                        : 'success'
                                                }
                                            >
                                                {product.stock}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={product.is_active ? 'success' : 'default'}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/products/${product.id}/edit`} preserveScroll>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(product)}
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
                    {products.data.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No products found</div>
                    )}
                </Card>

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {products.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-4 py-2 rounded-lg text-sm ${
                                    link.active
                                        ? 'bg-gray-900 text-white'
                                        : link.url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
