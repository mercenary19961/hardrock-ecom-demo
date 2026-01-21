import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent, Select, ColorPicker, SizeStockEditor, Badge, UndoButton } from '@/Components/ui';
import { Category, Product } from '@/types/models';
import {
    ArrowLeft, X, Package, DollarSign, Image as ImageIcon, Settings, Palette,
    BarChart3, Eye, ShoppingCart, Star, Calendar, Clock, FileText, Save,
    RotateCcw, Check, ArrowUp, ExternalLink, Copy, Trash2, Search, Globe,
    History, AlertCircle
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface FieldChange {
    field: string;
    label: string;
    type: 'text' | 'textarea' | 'boolean' | 'image' | 'select';
    old: string;
    new: string;
    old_path?: string;
    new_path?: string;
    old_id?: string | number;
    new_id?: string | number;
}

interface UndoMeta {
    available: boolean;
    saved_at: string;
    saved_by: number;
    changes?: FieldChange[];
}

interface Props {
    product: Product;
    categories: Category[];
    undoMeta: UndoMeta | null;
}

// Format date for display
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function EditProduct({ product, categories, undoMeta }: Props) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Store initial values for reset functionality
    const initialValues = {
        _method: 'PUT' as const,
        category_id: product.category_id.toString(),
        name: product.name,
        name_ar: product.name_ar || '',
        slug: product.slug,
        description: product.description || '',
        description_ar: product.description_ar || '',
        short_description: product.short_description || '',
        short_description_ar: product.short_description_ar || '',
        price: product.price.toString(),
        compare_price: product.compare_price?.toString() || '',
        sku: product.sku,
        stock: product.stock,
        low_stock_threshold: product.low_stock_threshold?.toString() || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        images: [] as File[],
        delete_images: [] as number[],
        // Variant fields
        color: product.color || '',
        color_hex: product.color_hex || '',
        available_sizes: product.available_sizes || [] as string[],
        size_stock: product.size_stock || {} as Record<string, number>,
        product_group: product.product_group || '',
    };

    const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm(initialValues);

    // Reset form when product prop changes (e.g., after undo restore)
    useEffect(() => {
        setData({
            _method: 'PUT',
            category_id: product.category_id.toString(),
            name: product.name,
            name_ar: product.name_ar || '',
            slug: product.slug,
            description: product.description || '',
            description_ar: product.description_ar || '',
            short_description: product.short_description || '',
            short_description_ar: product.short_description_ar || '',
            price: product.price.toString(),
            compare_price: product.compare_price?.toString() || '',
            sku: product.sku,
            stock: product.stock,
            low_stock_threshold: product.low_stock_threshold?.toString() || '',
            is_active: product.is_active,
            is_featured: product.is_featured,
            images: [],
            delete_images: [],
            color: product.color || '',
            color_hex: product.color_hex || '',
            available_sizes: product.available_sizes || [],
            size_stock: product.size_stock || {},
            product_group: product.product_group || '',
        });
    }, [product.id, product.updated_at]);

    // Check if form has changes
    const hasChanges =
        data.name !== initialValues.name ||
        data.name_ar !== initialValues.name_ar ||
        data.slug !== initialValues.slug ||
        data.description !== initialValues.description ||
        data.description_ar !== initialValues.description_ar ||
        data.short_description !== initialValues.short_description ||
        data.short_description_ar !== initialValues.short_description_ar ||
        data.category_id !== initialValues.category_id ||
        data.price !== initialValues.price ||
        data.compare_price !== initialValues.compare_price ||
        data.sku !== initialValues.sku ||
        data.stock !== initialValues.stock ||
        data.low_stock_threshold !== initialValues.low_stock_threshold ||
        data.is_active !== initialValues.is_active ||
        data.is_featured !== initialValues.is_featured ||
        data.color !== initialValues.color ||
        data.color_hex !== initialValues.color_hex ||
        data.product_group !== initialValues.product_group ||
        JSON.stringify(data.available_sizes) !== JSON.stringify(initialValues.available_sizes) ||
        JSON.stringify(data.size_stock) !== JSON.stringify(initialValues.size_stock) ||
        data.images.length > 0 ||
        data.delete_images.length > 0;

    // Revert all changes to initial values
    const handleRevertChanges = () => {
        reset();
        const fileInput = document.getElementById('edit_images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    // Show success message when form is submitted successfully
    useEffect(() => {
        if (recentlySuccessful) {
            setShowSuccess(true);
            const fileInput = document.getElementById('edit_images') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
            successTimerRef.current = setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [recentlySuccessful]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

    // Track scroll position to show/hide scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/products/${product.id}`, {
            preserveScroll: true,
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setData('images', Array.from(e.target.files));
        }
    };

    const handleDeleteImage = (imageId: number) => {
        setData('delete_images', [...data.delete_images, imageId]);
    };

    const existingImages = product.images?.filter(
        (img) => !data.delete_images.includes(img.id)
    ) || [];

    return (
        <AdminLayout>
            <Head title={`Edit ${product.name}`} />

            <div className="max-w-7xl mx-auto">
                {/* Top Action Bar - Back Link, Undo Button & Form Actions */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <Link
                        href="/admin/products"
                        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Link>
                    <UndoButton
                        modelType="product"
                        modelId={product.id}
                        undoMeta={undoMeta}
                    />
                    <div className="flex gap-3 ml-auto">
                        <Button
                            type="submit"
                            form="product-edit-form"
                            disabled={processing || !hasChanges}
                            className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Saving...' : 'Update Product'}
                        </Button>
                        {hasChanges && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleRevertChanges}
                                className="flex items-center gap-2 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Revert Changes
                            </Button>
                        )}
                        <Link href="/admin/products">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="h-6 w-6 text-purple-600" />
                        Edit Product
                    </h1>
                    <div className="flex items-center gap-2">
                        <Badge variant={product.is_active ? 'success' : 'default'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {product.is_featured && (
                            <Badge variant="warning">Featured</Badge>
                        )}
                    </div>
                </div>

                <form id="product-edit-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - Left Column (2/3 width on desktop) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        Basic Information
                                    </h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Select
                                        label="Category"
                                        id="edit_category_id"
                                        name="category_id"
                                        value={data.category_id}
                                        onChange={(value) => setData('category_id', value)}
                                        options={categories.map((cat) => ({
                                            value: cat.id.toString(),
                                            label: cat.name,
                                            isChild: !!cat.parent_id,
                                        }))}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Name (English)"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={errors.name}
                                            required
                                        />
                                        <Input
                                            label="Name (Arabic)"
                                            value={data.name_ar}
                                            onChange={(e) => setData('name_ar', e.target.value)}
                                            error={errors.name_ar}
                                            dir="rtl"
                                            placeholder="الاسم بالعربية"
                                        />
                                    </div>

                                    <Input
                                        label="Slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        error={errors.slug}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Textarea
                                            label="Short Description (English)"
                                            value={data.short_description}
                                            onChange={(e) => setData('short_description', e.target.value)}
                                            error={errors.short_description}
                                            rows={2}
                                            maxLength={500}
                                        />
                                        <Textarea
                                            label="Short Description (Arabic)"
                                            value={data.short_description_ar}
                                            onChange={(e) => setData('short_description_ar', e.target.value)}
                                            error={errors.short_description_ar}
                                            rows={2}
                                            maxLength={500}
                                            dir="rtl"
                                            placeholder="الوصف المختصر بالعربية"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Textarea
                                            label="Description (English)"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            error={errors.description}
                                            rows={5}
                                        />
                                        <Textarea
                                            label="Description (Arabic)"
                                            value={data.description_ar}
                                            onChange={(e) => setData('description_ar', e.target.value)}
                                            error={errors.description_ar}
                                            rows={5}
                                            dir="rtl"
                                            placeholder="الوصف بالعربية"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pricing & Inventory */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-purple-600" />
                                        Pricing & Inventory
                                    </h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price}
                                            onChange={(e) => setData('price', e.target.value)}
                                            error={errors.price}
                                            required
                                        />
                                        <Input
                                            label="Compare Price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.compare_price}
                                            onChange={(e) => setData('compare_price', e.target.value)}
                                            error={errors.compare_price}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="SKU"
                                            value={data.sku}
                                            onChange={(e) => setData('sku', e.target.value)}
                                            error={errors.sku}
                                        />
                                        <Input
                                            label="Stock"
                                            type="number"
                                            min="0"
                                            value={data.stock}
                                            onChange={(e) => setData('stock', parseInt(e.target.value) || 0)}
                                            error={errors.stock}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            label="Low Stock Threshold (optional)"
                                            type="number"
                                            min="1"
                                            max="1000"
                                            value={data.low_stock_threshold}
                                            onChange={(e) => setData('low_stock_threshold', e.target.value)}
                                            error={errors.low_stock_threshold}
                                            placeholder={`Inherit from category (${product.category?.low_stock_threshold ?? 10})`}
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Leave empty to use the category's threshold. Set a value to override for this product only.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Variant Options */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Palette className="h-5 w-5 text-purple-600" />
                                        Variant Options
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Optional: Add color and size variants for this product
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <ColorPicker
                                        label="Color"
                                        colorName={data.color}
                                        colorHex={data.color_hex}
                                        onColorNameChange={(value) => setData('color', value)}
                                        onColorHexChange={(value) => setData('color_hex', value)}
                                        error={errors.color || errors.color_hex}
                                    />

                                    <SizeStockEditor
                                        label="Sizes & Stock"
                                        sizes={data.available_sizes}
                                        sizeStock={data.size_stock}
                                        onSizesChange={(sizes) => setData('available_sizes', sizes)}
                                        onSizeStockChange={(stock) => setData('size_stock', stock)}
                                        error={errors.available_sizes || errors.size_stock}
                                    />

                                    <div>
                                        <Input
                                            label="Product Group (optional)"
                                            value={data.product_group}
                                            onChange={(e) => setData('product_group', e.target.value)}
                                            error={errors.product_group}
                                            placeholder="Group related color variants together"
                                        />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Use the same group name for products that are color variants of each other.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Images */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-purple-600" />
                                        Images
                                    </h2>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Existing Images */}
                                    {existingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            {existingImages.map((image) => (
                                                <div key={image.id} className="relative group">
                                                    <img
                                                        src={getImageUrl(image.path, product.id, image.sort_order)}
                                                        alt=""
                                                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage(image.id)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                    {image.is_primary && (
                                                        <span className="absolute bottom-1 left-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="edit_images" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Add Images
                                        </label>
                                        <input
                                            id="edit_images"
                                            name="images"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="w-full text-sm text-gray-500 dark:text-gray-400
                                                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                                                file:text-sm file:font-medium
                                                file:bg-purple-100 file:text-purple-700
                                                dark:file:bg-purple-900/30 dark:file:text-purple-400
                                                hover:file:bg-purple-200 dark:hover:file:bg-purple-900/50
                                                file:cursor-pointer file:transition-colors"
                                        />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add more images (max 5 total)</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar - Right Column (1/3 width on desktop) */}
                        <div className="space-y-6">
                            {/* Product Preview */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Eye className="h-5 w-5 text-purple-600" />
                                        Preview
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {/* Product Image */}
                                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                            {existingImages.length > 0 ? (
                                                <img
                                                    src={getImageUrl(existingImages[0].path, product.id, existingImages[0].sort_order)}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Product Info */}
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                                                {data.name || 'Product Name'}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {product.category?.name || 'Category'}
                                            </p>
                                        </div>
                                        {/* Price */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                {parseFloat(data.price || '0').toFixed(2)} JOD
                                            </span>
                                            {data.compare_price && parseFloat(data.compare_price) > parseFloat(data.price) && (
                                                <>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                        {parseFloat(data.compare_price).toFixed(2)} JOD
                                                    </span>
                                                    <Badge variant="danger" className="text-xs">
                                                        -{Math.round(((parseFloat(data.compare_price) - parseFloat(data.price)) / parseFloat(data.compare_price)) * 100)}%
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                        {/* Stock Status */}
                                        <div className="flex items-center gap-2">
                                            {data.stock > 0 ? (
                                                <Badge variant="success" className="text-xs">In Stock ({data.stock})</Badge>
                                            ) : (
                                                <Badge variant="danger" className="text-xs">Out of Stock</Badge>
                                            )}
                                            {data.is_featured && <Badge variant="warning" className="text-xs">Featured</Badge>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-purple-600" />
                                        Quick Actions
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <a
                                            href={`/product/${product.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            View on Store
                                        </a>
                                        <Link
                                            href={`/admin/products/create?duplicate=${product.id}`}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Copy className="h-4 w-4" />
                                            Duplicate Product
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                                                    // Use Inertia to delete
                                                    const form = document.createElement('form');
                                                    form.method = 'POST';
                                                    form.action = `/admin/products/${product.id}`;
                                                    form.innerHTML = `
                                                        <input type="hidden" name="_method" value="DELETE" />
                                                        <input type="hidden" name="_token" value="${document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''}" />
                                                    `;
                                                    document.body.appendChild(form);
                                                    form.submit();
                                                }
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Product
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product Statistics (Read-only) */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-purple-600" />
                                        Statistics
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Eye className="h-4 w-4" />
                                                <span className="text-sm">Views</span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{(product.view_count ?? 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <ShoppingCart className="h-4 w-4" />
                                                <span className="text-sm">Purchases</span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{(product.times_purchased ?? 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Star className="h-4 w-4" />
                                                <span className="text-sm">Rating</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-gray-900 dark:text-white">{Number(product.average_rating ?? 0).toFixed(1)}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">({product.rating_count ?? 0} reviews)</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-4 w-4" />
                                                <span className="text-sm">Created</span>
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(product.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-sm">Updated</span>
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(product.updated_at)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SEO Preview */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Search className="h-5 w-5 text-purple-600" />
                                        SEO Preview
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                                        {/* Google-style preview */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Globe className="h-3 w-3" />
                                                <span className="truncate">demo.hardrock-co.com › product › {data.slug || 'product-slug'}</span>
                                            </div>
                                            <h3 className="text-blue-600 dark:text-blue-400 text-base font-medium hover:underline cursor-pointer line-clamp-1">
                                                {data.name || 'Product Name'} | HardRock Store
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {data.short_description || data.description || 'No description provided. Add a short description to improve SEO.'}
                                            </p>
                                        </div>
                                    </div>
                                    {/* SEO Tips */}
                                    <div className="mt-3 space-y-2">
                                        {!data.short_description && (
                                            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                <span>Add a short description for better SEO</span>
                                            </div>
                                        )}
                                        {data.name && data.name.length < 20 && (
                                            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                <span>Consider a longer, more descriptive title</span>
                                            </div>
                                        )}
                                        {data.name && data.name.length >= 20 && data.short_description && (
                                            <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                                                <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                <span>SEO looks good!</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Activity Log */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <History className="h-5 w-5 text-purple-600" />
                                        Recent Activity
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {/* Last Update Info */}
                                        {undoMeta?.available && undoMeta.changes && undoMeta.changes.length > 0 ? (
                                            <>
                                                <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                        <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900 dark:text-white">
                                                            Product updated
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {formatDate(undoMeta.saved_at)}
                                                        </p>
                                                        <div className="mt-2 space-y-1">
                                                            {undoMeta.changes.slice(0, 3).map((change, idx) => (
                                                                <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                                    • {change.label} changed
                                                                </p>
                                                            ))}
                                                            {undoMeta.changes.length > 3 && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    +{undoMeta.changes.length - 3} more changes
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : null}

                                        {/* Creation Info */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                <Package className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    Product created
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {formatDate(product.created_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {!undoMeta?.available && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                                No recent changes recorded
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-purple-600" />
                                        Status
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                id="edit_is_active"
                                                name="is_active"
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                id="edit_is_featured"
                                                name="is_featured"
                                                type="checkbox"
                                                checked={data.is_featured}
                                                onChange={(e) => setData('is_featured', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </form>
            </div>

            {/* Scroll to Top Button - visible when scrolled down */}
            <button
                type="button"
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 z-40 lg:hidden p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-700 ${
                    showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
                title="Scroll to top"
            >
                <ArrowUp className="h-5 w-5" />
            </button>

            {/* Fixed Success Toast - Bottom Right */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 pl-4 pr-3 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="font-medium">Product updated successfully!</span>
                    <button
                        type="button"
                        onClick={() => setShowSuccess(false)}
                        className="ml-2 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
