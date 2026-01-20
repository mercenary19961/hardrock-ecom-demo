import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, CardHeader, CardContent, Badge } from '@/Components/ui';
import { Category } from '@/types/models';
import {
    ArrowLeft,
    ImageIcon,
    Type,
    Link2,
    FileText,
    FolderTree,
    ArrowUpDown,
    PackageSearch,
    ToggleLeft,
    Eye,
    Settings,
    Pencil,
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

interface Props {
    category: Category & { parent?: Category | null };
}

export default function ShowCategory({ category }: Props) {
    return (
        <AdminLayout>
            <Head title={`View ${category.name}`} />

            {/* Top Action Bar - Back Link & Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/admin/categories"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Categories
                </Link>
                <div className="flex gap-3 ml-auto">
                    <Link href={`/admin/categories/${category.id}/edit`}>
                        <Button>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Category
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left Card - Category Information */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Eye className="h-5 w-5 text-gray-600" />
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
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">English</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                        {category.name}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Arabic</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" dir="rtl">
                                        {category.name_ar || <span className="text-gray-400 italic">Not set</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                <Link2 className="h-4 w-4 text-gray-500" />
                                Slug
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm">
                                {category.slug}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                URL: /category/{category.slug}
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Description
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">English</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[80px]">
                                        {category.description || <span className="text-gray-400 italic">No description</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Arabic</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[80px]" dir="rtl">
                                        {category.description_ar || <span className="text-gray-400 italic">Not set</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parent Category */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                <FolderTree className="h-4 w-4 text-gray-500" />
                                Parent Category
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                {category.parent ? (
                                    <Link
                                        href={`/admin/categories/${category.parent.id}`}
                                        className="text-purple-600 hover:text-purple-800 hover:underline"
                                    >
                                        {category.parent.name}
                                    </Link>
                                ) : (
                                    <span className="text-gray-500">None (Top Level)</span>
                                )}
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                Sort Order
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 tabular-nums">
                                {category.sort_order}
                            </div>
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
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 tabular-nums">
                                {category.low_stock_threshold ?? 10}
                            </div>
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
                            <div>
                                <Badge variant={category.is_active ? 'success' : 'default'} className="text-sm">
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {category.is_active
                                    ? 'This category is visible on the storefront.'
                                    : 'This category is hidden from the storefront.'}
                            </p>
                        </div>

                        {/* Category Image */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                                <ImageIcon className="h-4 w-4 text-gray-500" />
                                Category Image
                            </label>

                            <div className="border border-gray-200 rounded-lg p-4">
                                {category.image ? (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-2">Custom Image</p>
                                        <img
                                            src={`/storage/${category.image}`}
                                            alt={category.name}
                                            className="w-full max-w-[200px] aspect-square object-cover rounded-lg border-2 border-green-400"
                                        />
                                    </div>
                                ) : defaultCategoryImages[category.slug] ? (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-2">Default Image</p>
                                        <img
                                            src={defaultCategoryImages[category.slug]}
                                            alt={`Default ${category.name}`}
                                            className="w-full max-w-[200px] aspect-square object-cover rounded-lg border border-gray-200"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full max-w-[200px] aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                        <span className="text-sm text-gray-400">No image</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                <span className="font-medium">Created:</span>{' '}
                                {category.created_at ? new Date(category.created_at).toLocaleString() : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">Last Updated:</span>{' '}
                                {category.updated_at ? new Date(category.updated_at).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
