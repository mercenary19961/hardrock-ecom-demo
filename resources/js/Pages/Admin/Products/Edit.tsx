import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Card, CardHeader, CardContent } from '@/Components/ui';
import { Category, Product } from '@/types/models';
import { ArrowLeft, X } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface Props {
    product: Product;
    categories: Category[];
}

export default function EditProduct({ product, categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        category_id: product.category_id.toString(),
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price.toString(),
        compare_price: product.compare_price?.toString() || '',
        sku: product.sku,
        stock: product.stock,
        is_active: product.is_active,
        is_featured: product.is_featured,
        images: [] as File[],
        delete_images: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/products/${product.id}`);
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                    required
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.parent_id ? '— ' : ''}{cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                            />

                            <Input
                                label="Slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                error={errors.slug}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Short Description
                                </label>
                                <textarea
                                    value={data.short_description}
                                    onChange={(e) => setData('short_description', e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={5}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Images</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {existingImages.map((image) => (
                                        <div key={image.id} className="relative">
                                            <img
                                                src={getImageUrl(image.path)}
                                                alt=""
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteImage(image.id)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            {image.is_primary && (
                                                <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full"
                            />
                            <p className="text-sm text-gray-500">Add more images (max 5 total)</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Status</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Featured</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" loading={processing}>
                            Update Product
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
