import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent, Select, ColorPicker, SizeStockEditor, Badge, NumberInput } from '@/Components/ui';
import { Category } from '@/types/models';
import { ArrowLeft, Copy } from 'lucide-react';

interface DuplicateProduct {
    category_id: number;
    name: string;
    name_ar: string;
    description: string;
    description_ar: string;
    short_description: string;
    short_description_ar: string;
    price: string;
    compare_price: string | null;
    stock: number;
    low_stock_threshold: number | null;
    is_active: boolean;
    is_featured: boolean;
    color: string | null;
    color_hex: string | null;
    available_sizes: string[] | null;
    size_stock: Record<string, number> | null;
    product_group: string | null;
}

interface Props {
    categories: Category[];
    duplicateProduct?: DuplicateProduct | null;
}

export default function CreateProduct({ categories, duplicateProduct }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: duplicateProduct?.category_id?.toString() || '',
        name: duplicateProduct?.name || '',
        name_ar: duplicateProduct?.name_ar || '',
        slug: '',
        description: duplicateProduct?.description || '',
        description_ar: duplicateProduct?.description_ar || '',
        short_description: duplicateProduct?.short_description || '',
        short_description_ar: duplicateProduct?.short_description_ar || '',
        price: duplicateProduct?.price?.toString() || '',
        compare_price: duplicateProduct?.compare_price?.toString() || '',
        sku: '',
        stock: duplicateProduct?.stock ?? 0,
        low_stock_threshold: duplicateProduct?.low_stock_threshold?.toString() || '',
        is_active: duplicateProduct?.is_active ?? true,
        is_featured: duplicateProduct?.is_featured ?? false,
        images: [] as File[],
        // Variant fields
        color: duplicateProduct?.color || '',
        color_hex: duplicateProduct?.color_hex || '',
        available_sizes: duplicateProduct?.available_sizes || [] as string[],
        size_stock: duplicateProduct?.size_stock || {} as Record<string, number>,
        product_group: duplicateProduct?.product_group || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/products');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setData('images', Array.from(e.target.files));
        }
    };

    return (
        <AdminLayout>
            <Head title={duplicateProduct ? "Duplicate Product" : "Create Product"} />

            <div className="max-w-3xl">
                <div className="mb-6">
                    <Link
                        href="/admin/products"
                        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Link>
                </div>

                {/* Duplicate Product Banner */}
                {duplicateProduct && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Duplicating Product
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                A new slug and SKU will be auto-generated. Images must be uploaded separately.
                            </p>
                        </div>
                        <Badge variant="info" className="text-xs">
                            Inactive by default
                        </Badge>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Select
                                    label="Category"
                                    id="category_id"
                                    name="category_id"
                                    value={data.category_id}
                                    onChange={(value) => setData('category_id', value)}
                                    placeholder="Select a category"
                                    options={categories.map((cat) => ({
                                        value: cat.id.toString(),
                                        label: cat.name,
                                        isChild: !!cat.parent_id,
                                    }))}
                                />
                                {errors.category_id && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category_id}</p>
                                )}
                            </div>

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
                                label="Slug (optional)"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                error={errors.slug}
                                placeholder="Auto-generated if empty"
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

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing & Inventory</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberInput
                                    label="Price"
                                    step={0.01}
                                    min={0}
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    error={errors.price}
                                    required
                                />
                                <NumberInput
                                    label="Compare Price (optional)"
                                    step={0.01}
                                    min={0}
                                    value={data.compare_price}
                                    onChange={(e) => setData('compare_price', e.target.value)}
                                    error={errors.compare_price}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="SKU (optional)"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    error={errors.sku}
                                    placeholder="Auto-generated if empty"
                                />
                                <NumberInput
                                    label="Stock"
                                    min={0}
                                    value={data.stock}
                                    onChange={(e) => setData('stock', parseInt(e.target.value) || 0)}
                                    error={errors.stock}
                                    required
                                />
                            </div>

                            <div>
                                <NumberInput
                                    label="Low Stock Threshold (optional)"
                                    min={1}
                                    max={1000}
                                    value={data.low_stock_threshold}
                                    onChange={(e) => setData('low_stock_threshold', e.target.value)}
                                    error={errors.low_stock_threshold}
                                    placeholder="Inherit from category"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Leave empty to use the category's threshold. Set a value to override for this product only.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Variant Options</h2>
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

                            <Input
                                label="Product Group (optional)"
                                value={data.product_group}
                                onChange={(e) => setData('product_group', e.target.value)}
                                error={errors.product_group}
                                placeholder="Group related color variants together"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-3">
                                Use the same group name for products that are color variants of each other.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Images</h2>
                        </CardHeader>
                        <CardContent>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Product Images
                            </label>
                            <input
                                id="images"
                                name="images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Upload up to 5 images. First image will be the primary.
                            </p>
                            {errors.images && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.images}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_active"
                                        name="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_featured"
                                        name="is_featured"
                                        type="checkbox"
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
                                    />
                                    <label htmlFor="is_featured" className="text-sm text-gray-700 dark:text-gray-300">Featured</label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Create Product
                        </Button>
                        <Link href="/admin/products">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
