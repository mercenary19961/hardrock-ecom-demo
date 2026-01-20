import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent } from '@/Components/ui';
import { Category } from '@/types/models';
import {
    ArrowLeft,
    ImageIcon,
    X,
    Type,
    Link2,
    FileText,
    FolderTree,
    ArrowUpDown,
    PackageSearch,
    ToggleLeft,
    Pencil,
    Settings,
    Info,
} from 'lucide-react';

interface Props {
    parentCategories: Category[];
}

export default function CreateCategory({ parentCategories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('image', file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const clearImageSelection = () => {
        setData('image', null);
        setImagePreview(null);
        const fileInput = document.getElementById('cat_image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/categories', {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Category" />

            {/* Top Action Bar - Back Link & Form Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/admin/categories"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Categories
                </Link>
                <div className="flex gap-3 ml-auto">
                    <Button
                        type="submit"
                        form="category-create-form"
                        disabled={processing}
                    >
                        {processing ? 'Creating...' : 'Create Category'}
                    </Button>
                    <Link href="/admin/categories">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </div>

            <form id="category-create-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left Card - Category Information */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Pencil className="h-5 w-5 text-gray-600" />
                                Category Information
                            </h2>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Category Name */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <Type className="h-4 w-4 text-gray-500" />
                                    Category Name
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="English"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                        placeholder="Category name"
                                        required
                                    />
                                    <Input
                                        label="Arabic"
                                        value={data.name_ar}
                                        onChange={(e) => setData('name_ar', e.target.value)}
                                        error={errors.name_ar}
                                        dir="rtl"
                                        placeholder="الاسم بالعربية"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    The category name displayed to customers. Arabic name is shown when the site language is set to Arabic.
                                </p>
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <Link2 className="h-4 w-4 text-gray-500" />
                                    Slug (optional)
                                </label>
                                <Input
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    error={errors.slug}
                                    placeholder="Auto-generated if empty"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    URL-friendly identifier used in the category page address (e.g., /category/electronics). Auto-generated from name if left empty.
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    Description
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Textarea
                                        label="English"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        error={errors.description}
                                        rows={3}
                                        placeholder="Category description"
                                    />
                                    <Textarea
                                        label="Arabic"
                                        value={data.description_ar}
                                        onChange={(e) => setData('description_ar', e.target.value)}
                                        error={errors.description_ar}
                                        rows={3}
                                        dir="rtl"
                                        placeholder="الوصف بالعربية"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Optional description shown on the category page. Helps customers understand what products are in this category.
                                </p>
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label htmlFor="parent_id" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <FolderTree className="h-4 w-4 text-gray-500" />
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
                                <p className="mt-1 text-xs text-gray-500">
                                    Set a parent to make this a subcategory. Subcategories appear under their parent in navigation and filters.
                                </p>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                    Sort Order
                                </label>
                                <Input
                                    type="number"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    error={errors.sort_order}
                                    min={0}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Controls the display order of categories. Lower numbers appear first.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Card - Settings & Media */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Settings className="h-5 w-5 text-gray-600" />
                                Settings & Media
                            </h2>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Low Stock Threshold */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <PackageSearch className="h-4 w-4 text-gray-500" />
                                    Low Stock Threshold
                                </label>
                                <Input
                                    type="number"
                                    value={data.low_stock_threshold}
                                    onChange={(e) => setData('low_stock_threshold', parseInt(e.target.value) || 10)}
                                    error={errors.low_stock_threshold}
                                    min={1}
                                    max={1000}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Products will be marked as "low stock" when quantity falls to or below this number.
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <ToggleLeft className="h-4 w-4 text-gray-500" />
                                    Status
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('is_active', true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            data.is_active
                                                ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${data.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('is_active', false)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            !data.is_active
                                                ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${!data.is_active ? 'bg-red-500' : 'bg-gray-400'}`} />
                                        Inactive
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Inactive categories are hidden from the storefront.
                                </p>
                            </div>

                            {/* Category Image
                                NOTE: Subcategory images are stored in the database but are not currently
                                displayed anywhere on the storefront. Only parent category images are shown
                                on the homepage category navigation. */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                                    <ImageIcon className="h-4 w-4 text-gray-500" />
                                    Category Image
                                </label>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium">Default images are pre-configured</p>
                                            <p className="text-blue-600 mt-1">
                                                Main categories (Electronics, Fashion, etc.) have optimized default images.
                                                Upload a custom image only if you want to feature a specific promotional image.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Preview */}
                                <div className="border border-gray-200 rounded-lg p-3 mb-4">
                                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        Custom Image (Optional)
                                    </p>
                                    {imagePreview ? (
                                        <div className="relative w-full max-w-[150px]">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full aspect-square object-cover rounded-lg border-2 border-purple-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={clearImageSelection}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                title="Remove selected image"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-[150px] aspect-square bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                                            <span className="text-xs text-gray-400">No image selected</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {imagePreview ? 'Image selected' : 'Select an image to preview'}
                                    </p>
                                </div>

                                {/* File Upload */}
                                <input
                                    id="cat_image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                                {errors.image && (
                                    <p className="mt-1 text-xs text-red-600">{errors.image}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Recommended: 400x400px. Max: 200KB. JPG, PNG, WebP.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AdminLayout>
    );
}
