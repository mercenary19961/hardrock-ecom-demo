import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Card, CardHeader, CardContent } from '@/Components/ui';
import { Category } from '@/types/models';
import { ArrowLeft } from 'lucide-react';

interface Props {
    categories: Category[];
}

export default function CreateProduct({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        name: '',
        slug: '',
        description: '',
        short_description: '',
        price: '',
        compare_price: '',
        sku: '',
        stock: 0,
        low_stock_threshold: '',
        is_active: true,
        is_featured: false,
        images: [] as File[],
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
            <Head title="Create Product" />

            <div className="max-w-3xl">
                <div className="mb-6">
                    <Link
                        href="/admin/products"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Basic Information</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.parent_id ? '— ' : ''}{cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                                )}
                            </div>

                            <Input
                                label="Name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                            />

                            <Input
                                label="Slug (optional)"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                error={errors.slug}
                                placeholder="Auto-generated if empty"
                            />

                            <div>
                                <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Short Description
                                </label>
                                <textarea
                                    id="short_description"
                                    name="short_description"
                                    value={data.short_description}
                                    onChange={(e) => setData('short_description', e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={5}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Pricing & Inventory</h2>
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
                                    label="Compare Price (optional)"
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
                                    label="SKU (optional)"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    error={errors.sku}
                                    placeholder="Auto-generated if empty"
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
                                    placeholder="Inherit from category"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Leave empty to use the category's threshold. Set a value to override for this product only.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Images</h2>
                        </CardHeader>
                        <CardContent>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
                                Product Images
                            </label>
                            <input
                                id="images"
                                name="images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Upload up to 5 images. First image will be the primary.
                            </p>
                            {errors.images && (
                                <p className="mt-1 text-sm text-red-600">{errors.images}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Status</h2>
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
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_featured"
                                        name="is_featured"
                                        type="checkbox"
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <label htmlFor="is_featured" className="text-sm text-gray-700">Featured</label>
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
