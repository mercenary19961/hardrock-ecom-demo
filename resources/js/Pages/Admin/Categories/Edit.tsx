import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent, UndoButton } from '@/Components/ui';
import { Category } from '@/types/models';
import {
    ArrowLeft,
    ImageIcon,
    X,
    Check,
    Type,
    Link2,
    FileText,
    FolderTree,
    ArrowUpDown,
    PackageSearch,
    ToggleLeft,
    Pencil,
    RotateCcw,
    Settings,
} from 'lucide-react';

// Map category slugs to default homepage images
const defaultCategoryImages: Record<string, string> = {
    'electronics': '/images/home_mini/ELECTRONICS@2x.webp',
    'skincare': '/images/home_mini/SKINCARE@2x.webp',
    'building-blocks': '/images/home_mini/BLOCKS@2x.webp',
    'fashion': '/images/home_mini/FASHION@2x.webp',
    'home-kitchen': '/images/home_mini/HOME&KITCHEN@2x.webp',
    'sports': '/images/home_mini/SPORT@2x.webp',
    'stationery': '/images/home_mini/STATIONARY@2x.webp',
    'kids': '/images/home_mini/KIDS@2x.webp',
};

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
    category: Category;
    parentCategories: Category[];
    undoMeta: UndoMeta | null;
}

export default function EditCategory({ category, parentCategories, undoMeta }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Store initial values for reset functionality
    const initialValues = {
        _method: 'PUT' as const,
        name: category.name,
        name_ar: category.name_ar || '',
        slug: category.slug,
        description: category.description || '',
        description_ar: category.description_ar || '',
        parent_id: category.parent_id?.toString() || '',
        sort_order: category.sort_order,
        is_active: category.is_active,
        low_stock_threshold: category.low_stock_threshold ?? 10,
        image: null as File | null,
    };

    const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm(initialValues);

    // Reset form when category prop changes (e.g., after undo restore)
    useEffect(() => {
        setData({
            _method: 'PUT',
            name: category.name,
            name_ar: category.name_ar || '',
            slug: category.slug,
            description: category.description || '',
            description_ar: category.description_ar || '',
            parent_id: category.parent_id?.toString() || '',
            sort_order: category.sort_order,
            is_active: category.is_active,
            low_stock_threshold: category.low_stock_threshold ?? 10,
            image: null,
        });
        setImagePreview(null);
    }, [category.id, category.updated_at]); // Reset when category is updated

    // Check if form has changes
    const hasChanges =
        data.name !== initialValues.name ||
        data.name_ar !== initialValues.name_ar ||
        data.slug !== initialValues.slug ||
        data.description !== initialValues.description ||
        data.description_ar !== initialValues.description_ar ||
        data.parent_id !== initialValues.parent_id ||
        data.sort_order !== initialValues.sort_order ||
        data.is_active !== initialValues.is_active ||
        data.low_stock_threshold !== initialValues.low_stock_threshold ||
        data.image !== null;

    // Revert all changes to initial values
    const handleRevertChanges = () => {
        reset();
        setImagePreview(null);
        const fileInput = document.getElementById('edit_cat_image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

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
        // Reset the file input
        const fileInput = document.getElementById('edit_cat_image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    // Track timer ref to prevent premature cleanup
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Show success message when form is submitted successfully
    useEffect(() => {
        if (recentlySuccessful) {
            setShowSuccess(true);
            // Clear the image preview since it's now saved
            setImagePreview(null);
            const fileInput = document.getElementById('edit_cat_image') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Clear any existing timer
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }

            // Hide success message after 5 seconds
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/categories/${category.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit ${category.name}`} />

            {/* Top Action Bar - Back Link, Undo Button & Form Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/admin/categories"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Categories
                </Link>
                <UndoButton
                    modelType="category"
                    modelId={category.id}
                    undoMeta={undoMeta}
                />
                <div className="flex gap-3 ml-auto">
                    <Button
                        type="submit"
                        form="category-edit-form"
                        disabled={processing || !hasChanges}
                        className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        {processing ? 'Saving...' : 'Update Category'}
                    </Button>
                    {hasChanges && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRevertChanges}
                            className="flex items-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Revert Changes
                        </Button>
                    )}
                    <Link href="/admin/categories">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </div>

            <form id="category-edit-form" onSubmit={handleSubmit}>
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
                                    Slug
                                </label>
                                <Input
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    error={errors.slug}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    URL-friendly identifier used in the category page address (e.g., /category/electronics). Changing this may break existing links.
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
                                <label htmlFor="edit_parent_id" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <FolderTree className="h-4 w-4 text-gray-500" />
                                    Parent Category
                                </label>
                                <select
                                    id="edit_parent_id"
                                    name="parent_id"
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 outline-none"
                                >
                                    <option value="">None (Top Level)</option>
                                    {parentCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Set a parent to make this a subcategory. Subcategories appear under their parent in navigation and filters.
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

                                {/* Current Images Display */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Currently Displayed Image */}
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            Current Image
                                        </p>
                                        {category.image ? (
                                            <img
                                                src={`/storage/${category.image}`}
                                                alt={category.name}
                                                className="w-full max-w-[150px] aspect-square object-cover rounded-lg border-2 border-green-400"
                                            />
                                        ) : defaultCategoryImages[category.slug] ? (
                                            <img
                                                src={defaultCategoryImages[category.slug]}
                                                alt={`Default ${category.name}`}
                                                className="w-full max-w-[150px] aspect-square object-cover rounded-lg border border-gray-100"
                                            />
                                        ) : (
                                            <div className="w-full max-w-[150px] aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                <span className="text-xs text-gray-400">No image</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {category.image ? 'Custom' : 'Default'}
                                        </p>
                                    </div>

                                    {/* New Image Preview / Upload */}
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            {imagePreview ? 'New Image' : 'Upload New'}
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
                                                <span className="text-xs text-gray-400">Select file</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {imagePreview ? 'Save to apply' : 'Choose file'}
                                        </p>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <input
                                    id="edit_cat_image"
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

            {/* Fixed Success Toast - Bottom Right */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 pl-4 pr-3 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">Category updated successfully!</span>
                    <button
                        type="button"
                        onClick={() => setShowSuccess(false)}
                        className="ml-2 p-1 rounded-md hover:bg-green-100 transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4 text-green-600" />
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
