import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent, Select, ColorPicker, SizeStockEditor, Badge, UndoButton } from '@/Components/ui';
import { Category, Product } from '@/types/models';
import {
    ArrowLeft, X, Package, DollarSign, Image as ImageIcon, Settings, Palette,
    BarChart3, Eye, ShoppingCart, Star, Calendar, Clock, FileText, Save,
    RotateCcw, Check, ArrowUp, ExternalLink, Copy, Trash2, Search, Globe,
    History, AlertCircle, GripVertical, Upload
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

// Draggable Image Component for reordering
interface DraggableImageProps {
    image: { id: number; path: string; is_primary: boolean; sort_order: number };
    productId: number;
    index: number;
    onDelete: (id: number) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    dragOverIndex: number | null;
}

function DraggableImage({ image, productId, index, onDelete, onDragStart, onDragOver, onDragEnd, isDragging, dragOverIndex }: DraggableImageProps) {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className={`relative group cursor-move transition-all duration-200 ${
                isDragging ? 'opacity-50 scale-95' : ''
            } ${dragOverIndex === index ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
        >
            <div className="absolute top-1 left-1 z-10 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white" />
            </div>
            <img
                src={getImageUrl(image.path, productId, image.sort_order)}
                alt=""
                className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
            />
            <button
                type="button"
                onClick={() => onDelete(image.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
                <X className="h-3 w-3" />
            </button>
            {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded">
                    Primary
                </span>
            )}
        </div>
    );
}

// New Image Preview Component (for files selected but not yet uploaded)
interface NewImagePreviewProps {
    file: File;
    index: number;
    onRemove: (index: number) => void;
}

function NewImagePreview({ file, index, onRemove }: NewImagePreviewProps) {
    const [preview, setPreview] = useState<string>('');

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="relative group">
            <div className="absolute top-1 left-1 z-10 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">
                New
            </div>
            {preview ? (
                <img
                    src={preview}
                    alt={`New upload ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500"
                />
            ) : (
                <div className="w-24 h-24 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                    <Upload className="h-6 w-6 text-blue-400" />
                </div>
            )}
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

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

// Validation rules
interface ValidationErrors {
    name?: string;
    price?: string;
    stock?: string;
    sku?: string;
    slug?: string;
}

function validateField(field: string, value: string | number): string | undefined {
    switch (field) {
        case 'name':
            if (!value || String(value).trim() === '') return 'Product name is required';
            if (String(value).length < 2) return 'Name must be at least 2 characters';
            break;
        case 'price':
            const price = parseFloat(String(value));
            if (isNaN(price) || price < 0) return 'Price must be a positive number';
            break;
        case 'stock':
            const stock = parseInt(String(value));
            if (isNaN(stock) || stock < 0) return 'Stock must be 0 or greater';
            break;
        case 'sku':
            if (!value || String(value).trim() === '') return 'SKU is required';
            break;
        case 'slug':
            if (!value || String(value).trim() === '') return 'Slug is required';
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value))) return 'Slug must be lowercase with hyphens only';
            break;
    }
    return undefined;
}

// Auto-save key for localStorage
const getAutoSaveKey = (productId: number) => `product_draft_${productId}`;

export default function EditProduct({ product, categories, undoMeta }: Props) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showFloatingBar, setShowFloatingBar] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const topBarRef = useRef<HTMLDivElement | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    // Drag & drop state for image reordering
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [imageOrder, setImageOrder] = useState<number[]>([]);

    // Real-time validation state
    const [liveErrors, setLiveErrors] = useState<ValidationErrors>({});

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
        image_order: [] as number[],
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
            image_order: [],
            color: product.color || '',
            color_hex: product.color_hex || '',
            available_sizes: product.available_sizes || [],
            size_stock: product.size_stock || {},
            product_group: product.product_group || '',
        });
    }, [product.id, product.updated_at]);

    // Initialize image order from product images
    useEffect(() => {
        if (product.images && product.images.length > 0) {
            const sortedImages = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
            setImageOrder(sortedImages.map(img => img.id));
        }
    }, [product.id, product.images]);

    // Check if image order has changed
    const originalImageOrder = useMemo(() => {
        if (!product.images) return [];
        return [...product.images].sort((a, b) => a.sort_order - b.sort_order).map(img => img.id);
    }, [product.images]);

    const imageOrderChanged = useMemo(() => {
        if (imageOrder.length !== originalImageOrder.length) return false;
        return imageOrder.some((id, idx) => id !== originalImageOrder[idx]);
    }, [imageOrder, originalImageOrder]);

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
        data.delete_images.length > 0 ||
        imageOrderChanged;

    // Real-time validation handler
    const handleFieldChange = useCallback((field: string, value: string | number) => {
        const error = validateField(field, value);
        setLiveErrors(prev => ({
            ...prev,
            [field]: error
        }));
    }, []);

    // Drag & drop handlers for image reordering
    const handleDragStart = useCallback((index: number) => {
        setDragIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    }, []);

    const handleDragEnd = useCallback(() => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            setImageOrder(prev => {
                const newOrder = [...prev];
                const [draggedId] = newOrder.splice(dragIndex, 1);
                newOrder.splice(dragOverIndex, 0, draggedId);
                return newOrder;
            });
        }
        setDragIndex(null);
        setDragOverIndex(null);
    }, [dragIndex, dragOverIndex]);

    // Remove a new image from the upload queue
    const handleRemoveNewImage = useCallback((index: number) => {
        setData('images', data.images.filter((_, i) => i !== index));
        // Also reset file input if all images removed
        if (data.images.length <= 1) {
            const fileInput = document.getElementById('edit_images') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    }, [data.images, setData]);

    // Revert all changes to initial values
    const handleRevertChanges = useCallback(() => {
        reset();
        setImageOrder(originalImageOrder);
        setLiveErrors({});
        clearAutoSaveDraft();
        const fileInput = document.getElementById('edit_images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, [reset, originalImageOrder]);

    // Auto-save functions
    const saveAutoSaveDraft = useCallback(() => {
        const draft = {
            data: {
                name: data.name,
                name_ar: data.name_ar,
                slug: data.slug,
                description: data.description,
                description_ar: data.description_ar,
                short_description: data.short_description,
                short_description_ar: data.short_description_ar,
                category_id: data.category_id,
                price: data.price,
                compare_price: data.compare_price,
                sku: data.sku,
                stock: data.stock,
                low_stock_threshold: data.low_stock_threshold,
                is_active: data.is_active,
                is_featured: data.is_featured,
                color: data.color,
                color_hex: data.color_hex,
                available_sizes: data.available_sizes,
                size_stock: data.size_stock,
                product_group: data.product_group,
            },
            imageOrder,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem(getAutoSaveKey(product.id), JSON.stringify(draft));
    }, [data, imageOrder, product.id]);

    const clearAutoSaveDraft = useCallback(() => {
        localStorage.removeItem(getAutoSaveKey(product.id));
        setHasDraft(false);
    }, [product.id]);

    const restoreAutoSaveDraft = useCallback(() => {
        const draftJson = localStorage.getItem(getAutoSaveKey(product.id));
        if (draftJson) {
            try {
                const draft = JSON.parse(draftJson);
                setData(prev => ({
                    ...prev,
                    ...draft.data,
                }));
                if (draft.imageOrder) {
                    setImageOrder(draft.imageOrder);
                }
                setHasDraft(false);
                clearAutoSaveDraft();
            } catch {
                clearAutoSaveDraft();
            }
        }
    }, [product.id, setData, clearAutoSaveDraft]);

    // Check for existing draft on mount
    useEffect(() => {
        const draftJson = localStorage.getItem(getAutoSaveKey(product.id));
        if (draftJson) {
            try {
                const draft = JSON.parse(draftJson);
                // Only show draft notice if it's newer than last update
                if (draft.savedAt && new Date(draft.savedAt) > new Date(product.updated_at)) {
                    setHasDraft(true);
                } else {
                    clearAutoSaveDraft();
                }
            } catch {
                clearAutoSaveDraft();
            }
        }
    }, [product.id, product.updated_at, clearAutoSaveDraft]);

    // Auto-save with debounce (save 1 second after last change)
    useEffect(() => {
        if (hasChanges) {
            autoSaveTimerRef.current = setTimeout(() => {
                saveAutoSaveDraft();
            }, 1000); // Save 1 second after last change
        }
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [hasChanges, data, imageOrder, saveAutoSaveDraft]);

    // Show browser's native "unsaved changes" dialog when leaving
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasChanges && !processing) {
                    formRef.current?.requestSubmit();
                }
            }
            // Escape to revert changes (only if there are changes and not in an input)
            if (e.key === 'Escape' && hasChanges) {
                const activeElement = document.activeElement;
                const isInInput = activeElement?.tagName === 'INPUT' ||
                                  activeElement?.tagName === 'TEXTAREA' ||
                                  activeElement?.tagName === 'SELECT';
                if (!isInInput) {
                    handleRevertChanges();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, processing, handleRevertChanges]);

    // Track scroll position to show/hide floating action bar
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
            // Show floating bar when top bar is out of view
            if (topBarRef.current) {
                const rect = topBarRef.current.getBoundingClientRect();
                setShowFloatingBar(rect.bottom < 0);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add image_order to form data before submission
        setData('image_order', imageOrder);
        // Use setTimeout to ensure setData completes before post
        setTimeout(() => {
            post(`/admin/products/${product.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    clearAutoSaveDraft();
                },
            });
        }, 0);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Append to existing new images instead of replacing
            setData('images', [...data.images, ...Array.from(e.target.files)]);
        }
    };

    const handleDeleteImage = (imageId: number) => {
        setData('delete_images', [...data.delete_images, imageId]);
        // Also remove from imageOrder
        setImageOrder(prev => prev.filter(id => id !== imageId));
    };

    // Get existing images sorted by the current imageOrder
    const existingImages = useMemo(() => {
        if (!product.images) return [];
        const filtered = product.images.filter(img => !data.delete_images.includes(img.id));
        // Sort by imageOrder
        return filtered.sort((a, b) => {
            const aIndex = imageOrder.indexOf(a.id);
            const bIndex = imageOrder.indexOf(b.id);
            // If not in imageOrder, put at end
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }, [product.images, data.delete_images, imageOrder]);

    return (
        <AdminLayout>
            <Head title={`Edit ${product.name}`} />

            <div className="max-w-7xl mx-auto">
                {/* Top Action Bar - Back Link, Undo Button & Form Actions */}
                <div ref={topBarRef} className="mb-6 flex flex-wrap items-center gap-4">
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
                            title="Ctrl+S"
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
                                title="Escape"
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

                <form id="product-edit-form" ref={formRef} onSubmit={handleSubmit}>
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
                                            onChange={(e) => {
                                                setData('name', e.target.value);
                                                handleFieldChange('name', e.target.value);
                                            }}
                                            error={liveErrors.name || errors.name}
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
                                        onChange={(e) => {
                                            setData('slug', e.target.value);
                                            handleFieldChange('slug', e.target.value);
                                        }}
                                        error={liveErrors.slug || errors.slug}
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
                                            onChange={(e) => {
                                                setData('price', e.target.value);
                                                handleFieldChange('price', e.target.value);
                                            }}
                                            error={liveErrors.price || errors.price}
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
                                            onChange={(e) => {
                                                setData('sku', e.target.value);
                                                handleFieldChange('sku', e.target.value);
                                            }}
                                            error={liveErrors.sku || errors.sku}
                                        />
                                        <Input
                                            label="Stock"
                                            type="number"
                                            min="0"
                                            value={data.stock}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value) || 0;
                                                setData('stock', value);
                                                handleFieldChange('stock', value);
                                            }}
                                            error={liveErrors.stock || errors.stock}
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
                                    {existingImages.length > 1 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Drag images to reorder. First image becomes the primary image.
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Existing Images - Draggable */}
                                    {existingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            {existingImages.map((image, index) => (
                                                <DraggableImage
                                                    key={image.id}
                                                    image={image}
                                                    productId={product.id}
                                                    index={index}
                                                    onDelete={handleDeleteImage}
                                                    onDragStart={handleDragStart}
                                                    onDragOver={handleDragOver}
                                                    onDragEnd={handleDragEnd}
                                                    isDragging={dragIndex === index}
                                                    dragOverIndex={dragOverIndex}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* New Images Preview */}
                                    {data.images.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New images to upload ({data.images.length})
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                {data.images.map((file, index) => (
                                                    <NewImagePreview
                                                        key={`new-${index}-${file.name}`}
                                                        file={file}
                                                        index={index}
                                                        onRemove={handleRemoveNewImage}
                                                    />
                                                ))}
                                            </div>
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
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Add more images (max 5 total, currently {existingImages.length + data.images.length})
                                        </p>
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

            {/* Floating Action Bar - visible when scrolled past top bar */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${
                showFloatingBar && hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            }`}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span>You have unsaved changes</span>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRevertChanges}
                            className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Revert
                        </Button>
                        <Button
                            type="submit"
                            form="product-edit-form"
                            size="sm"
                            disabled={processing}
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button - visible when scrolled down */}
            <button
                type="button"
                onClick={scrollToTop}
                className={`fixed z-40 lg:hidden p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-700 ${
                    showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                } ${showFloatingBar && hasChanges ? 'bottom-20 right-6' : 'bottom-6 right-6'}`}
                title="Scroll to top"
            >
                <ArrowUp className="h-5 w-5" />
            </button>

            {/* Draft Recovery Popup - Bottom Right */}
            {hasDraft && (
                <div className="fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-amber-500 dark:bg-amber-600 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <History className="h-4 w-4" />
                            <span className="font-medium text-sm">Draft Recovered</span>
                        </div>
                        <button
                            type="button"
                            onClick={clearAutoSaveDraft}
                            className="p-1 rounded-md hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                            title="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {/* Body */}
                    <div className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            You have unsaved changes from a previous editing session. Would you like to restore them?
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={restoreAutoSaveDraft}
                                className="flex-1"
                            >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={clearAutoSaveDraft}
                                className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400"
                            >
                                Discard
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Success Toast - Bottom Right */}
            {showSuccess && !hasDraft && (
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
