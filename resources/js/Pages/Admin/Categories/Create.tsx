import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Card, CardHeader, CardContent } from '@/Components/ui';
import { Category } from '@/types/models';
import { ArrowLeft } from 'lucide-react';

interface Props {
    parentCategories: Category[];
}

export default function CreateCategory({ parentCategories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        sort_order: 0,
        is_active: true,
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Parent Category
                                </label>
                                <select
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:outline-none"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                    className="w-full"
                                />
                                {errors.image && (
                                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Active
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" loading={processing}>
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
