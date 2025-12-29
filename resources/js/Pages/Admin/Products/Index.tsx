import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Badge, Select } from '@/Components/ui';
import { Product, Category, PaginatedData } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, LayoutGrid, List, MoreVertical, ImageIcon, Eye, Package, Tag, Layers, Info } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks';

// Product Detail Modal Component
function ProductDetailModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [product]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!product) return null;

    const images = product.images && product.images.length > 0 ? product.images : [];
    const currentImage = images[currentImageIndex]?.url || product.primary_image?.url;

    const getStockStatus = () => {
        if (product.stock === 0) return { label: 'Out of Stock', variant: 'danger' as const };
        const threshold = product.effective_low_stock_threshold ?? 10;
        if (product.stock <= threshold) return { label: 'Low Stock', variant: 'warning' as const };
        return { label: 'In Stock', variant: 'success' as const };
    };

    const stockStatus = getStockStatus();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {/* Image Section */}
                            <div className="space-y-4">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    {currentImage ? (
                                        <img
                                            src={currentImage}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-20 w-20 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                {/* Image Thumbnails */}
                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {images.map((img, index) => (
                                            <button
                                                key={img.id}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                                                    currentImageIndex === index ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                                                }`}
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="space-y-6">
                                {/* Title & Status */}
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                                        <Badge variant={product.is_active ? 'success' : 'default'}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                                    {product.compare_price && (
                                        <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                                    )}
                                    {product.compare_price && (
                                        <Badge variant="danger">
                                            -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                                        </Badge>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Layers className="h-4 w-4" />
                                            <span>Category</span>
                                        </div>
                                        <p className="font-medium text-gray-900">{product.category?.name || 'Uncategorized'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Package className="h-4 w-4" />
                                            <span>Stock</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{product.stock} units</span>
                                            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Info className="h-4 w-4" />
                                            <span>Low Stock Threshold</span>
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {product.effective_low_stock_threshold ?? 10} units
                                            {!product.low_stock_threshold && <span className="text-gray-400 text-xs ml-1">(default)</span>}
                                        </p>
                                    </div>
                                    {product.is_featured && (
                                        <div className="bg-yellow-50 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
                                                <Tag className="h-4 w-4" />
                                                <span>Featured</span>
                                            </div>
                                            <p className="font-medium text-yellow-700">This product is featured</p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{product.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Link href={`/admin/products/${product.id}/edit`}>
                            <Button>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Product
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface Props {
    products: PaginatedData<Product>;
    categories: Category[];
    filters: { search?: string; category?: string; status?: string; per_page?: string };
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

const perPageOptions = ['5', '10', '15', '25', '50', '100'];

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('productsViewMode') as 'table' | 'grid') || 'table';
        }
        return 'table';
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const isFirstRender = useRef(true);

    // Auto-refresh data every 30 seconds
    usePolling({ interval: 30000 });

    const debouncedSearch = useDebounce(search, 300);

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('productsViewMode', viewMode);
    }, [viewMode]);

    // SPA-style filter function
    const applyFilters = useCallback((searchVal: string, categoryVal: string, statusVal: string, perPageVal: string) => {
        router.get(
            '/admin/products',
            {
                search: searchVal || undefined,
                category: categoryVal || undefined,
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
        applyFilters(debouncedSearch, category, status, perPage);
    }, [debouncedSearch, applyFilters]);

    // Instant filter for dropdowns
    const handleCategoryChange = (value: string) => {
        setCategory(value);
        applyFilters(search, value, status, perPage);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        applyFilters(search, category, value, perPage);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters(search, category, status, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        applyFilters('', '', '', perPage);
    };

    const hasActiveFilters = filters.search || filters.category || filters.status;

    const handleDelete = (product: Product) => {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            router.delete(`/admin/products/${product.id}`);
        }
    };

    const getStockBadgeVariant = (product: Product): 'danger' | 'warning' | 'success' => {
        if (product.stock === 0) return 'danger';
        const threshold = product.effective_low_stock_threshold ?? 10;
        return product.stock <= threshold ? 'warning' : 'success';
    };

    return (
        <AdminLayout>
            <Head title="Products" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <div className="flex items-center gap-2">
                        {/* View Toggle - hidden on mobile */}
                        <div className="hidden sm:flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                title="Table view"
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                        <Link href="/admin/products/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Add Product</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <label htmlFor="products-search" className="sr-only">Search products</label>
                            <input
                                id="products-search"
                                name="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products..."
                                autoComplete="off"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-900 outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <Select
                            value={category}
                            onChange={handleCategoryChange}
                            className="w-full sm:w-48"
                            placeholder="All Categories"
                            options={[
                                { value: '', label: 'All Categories' },
                                ...categories.map((cat) => ({
                                    value: String(cat.id),
                                    label: cat.name,
                                })),
                            ]}
                        />
                        <Select
                            value={status}
                            onChange={handleStatusChange}
                            className="w-full sm:w-40"
                            placeholder="All Status"
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'low_stock', label: 'Low Stock' },
                                { value: 'out_of_stock', label: 'Out of Stock' },
                            ]}
                        />
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Grid View - shown on mobile always, on desktop when grid selected */}
                <div className={`${viewMode === 'grid' ? 'block' : 'block sm:hidden'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.data.map((product) => (
                            <Card key={product.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedProduct(product)}>
                                {/* Product Image */}
                                <div className="aspect-square bg-gray-100 relative">
                                    {product.primary_image?.url ? (
                                        <img
                                            src={product.primary_image.url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-gray-300" />
                                        </div>
                                    )}
                                    {/* Dropdown Menu */}
                                    <div className="absolute top-2 right-2">
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const menu = e.currentTarget.nextElementSibling;
                                                    menu?.classList.toggle('hidden');
                                                }}
                                                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                                            >
                                                <MoreVertical className="h-4 w-4 text-gray-600" />
                                            </button>
                                            <div className="hidden absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    preserveScroll
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-2 left-2">
                                        <Badge variant={product.is_active ? 'success' : 'default'}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-3">
                                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{product.category?.name || 'No category'}</p>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold tabular-nums">{formatPrice(product.price)}</div>
                                            {product.compare_price && (
                                                <div className="text-xs text-gray-400 line-through tabular-nums">
                                                    {formatPrice(product.compare_price)}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant={getStockBadgeVariant(product)}>
                                            {product.stock}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    {products.data.length === 0 && (
                        <Card>
                            <div className="text-center py-12 text-gray-500">No products found</div>
                        </Card>
                    )}
                </div>

                {/* Table View - hidden on mobile, shown on desktop when table selected */}
                <Card className={`${viewMode === 'table' ? 'hidden sm:block' : 'hidden'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="hidden lg:table-cell text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="hidden lg:table-cell text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-right pr-12 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-gray-300 transition-all"
                                                >
                                                    {product.primary_image?.url ? (
                                                        <img
                                                            src={product.primary_image.url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="h-5 w-5 text-gray-300" />
                                                        </div>
                                                    )}
                                                </button>
                                                <div className="min-w-0">
                                                    <div className="relative group/name">
                                                        <button
                                                            onClick={() => setSelectedProduct(product)}
                                                            className="font-medium text-gray-900 truncate max-w-[100px] lg:max-w-[120px] xl:max-w-[200px] hover:text-blue-600 text-left"
                                                        >
                                                            {product.name}
                                                        </button>
                                                        {/* Tooltip */}
                                                        <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover/name:opacity-100 group-hover/name:visible transition-opacity z-20 whitespace-nowrap max-w-[300px]">
                                                            {product.name}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        SKU: {product.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 text-gray-500">
                                            {product.category?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium tabular-nums">
                                                {formatPrice(product.price)}
                                            </div>
                                            {product.compare_price && (
                                                <div className="text-sm text-gray-400 line-through tabular-nums">
                                                    {formatPrice(product.compare_price)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4">
                                            <Badge variant={getStockBadgeVariant(product)}>
                                                {product.stock}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={product.is_active ? 'success' : 'default'}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="pr-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-0 sm:gap-0 md:gap-1 lg:gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedProduct(product)}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Button>
                                                <Link href={`/admin/products/${product.id}/edit`} preserveScroll>
                                                    <Button variant="ghost" size="sm" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(product)}
                                                    title="Delete"
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

                {/* Pagination and Per Page */}
                <div className="flex items-center justify-between">
                    <div className="flex-1" />
                    {products.last_page > 1 ? (
                        <div className="flex justify-center gap-1 sm:gap-2">
                            {/* Previous Button */}
                            <Link
                                href={products.links[0].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    products.links[0].url
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>

                            {/* Page Numbers */}
                            {products.links.slice(1, -1).map((link, index) => {
                                const pageNum = index + 1;
                                const currentPage = products.current_page;
                                const lastPage = products.last_page;

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
                                href={products.links[products.links.length - 1].url || '#'}
                                preserveScroll
                                preserveState
                                className={`px-3 py-2 rounded-lg text-sm ${
                                    products.links[products.links.length - 1].url
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
                            <label htmlFor="products-per-page" className="text-sm text-gray-500">Show:</label>
                            <select
                                id="products-per-page"
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

            {/* Product Detail Modal */}
            <ProductDetailModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </AdminLayout>
    );
}
