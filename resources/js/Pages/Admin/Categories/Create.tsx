import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent } from '@/Components/ui';
import { Category } from '@/types/models';
import { ArrowLeft } from 'lucide-react';

interface Props {
    parentCategories: Category[];
}

export default function CreateCategory({ parentCategories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        name_ar: '',
        slug: '',
        description: '',
        description_ar: '',
        parent_id: '',
        sort_order: 0,
        is_active: true,
        low_stock_threshold: 10,
        image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/categories');
    };

    return (
        <AdminLayout>
            <Head title="Create Category" />

            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link
                        href="/admin/categories"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Categories
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">Create Category</h1>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    label="Description (English)"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    error={errors.description}
                                    rows={3}
                                />
                                <Textarea
                                    label="Description (Arabic)"
                                    value={data.description_ar}
                                    onChange={(e) => setData('description_ar', e.target.value)}
                                    error={errors.description_ar}
                                    rows={3}
                                    dir="rtl"
                                    placeholder="الوصف بالعربية"
                                />
                            </div>

                            <div>
                                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                                    Parent Category
                                </label>
                                <select
                                    id="parent_id"
                                    name="parent_id"
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                >
                                    <option value="">None (Top Level)</option>
                                    {parentCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Sort Order"
                                type="number"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                error={errors.sort_order}
                            />

                            <div>
                                <Input
                                    label="Low Stock Threshold"
                                    type="number"
                                    value={data.low_stock_threshold}
                                    onChange={(e) => setData('low_stock_threshold', parseInt(e.target.value) || 10)}
                                    error={errors.low_stock_threshold}
                                    min={1}
                                    max={1000}
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Products in this category will be marked as "low stock" when their quantity falls to or below this number.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="cat_image" className="block text-sm font-medium text-gray-700 mb-1">
                                    Image
                                </label>
                                <input
                                    id="cat_image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                                {errors.image && (
                                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="cat_is_active"
                                    name="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                                <label htmlFor="cat_is_active" className="text-sm text-gray-700">
                                    Active
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    Create Category
                                </Button>
                                <Link href="/admin/categories">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
