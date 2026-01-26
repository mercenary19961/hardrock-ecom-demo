import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Textarea, Card, CardHeader, CardContent, Select, VariantStockEditor, Badge, UndoButton } from '@/Components/ui';
import { ColorOption, VariantStock } from '@/types/models';
import { Category, Product } from '@/types/models';
import {
    ArrowLeft, X, Package, DollarSign, Image as ImageIcon, Settings, Palette,
    BarChart3, Eye, ShoppingCart, Star, Calendar, Clock, FileText, Save,
    RotateCcw, Check, ArrowUp, ExternalLink, Copy, Trash2, Search, Globe,
    History, AlertCircle, GripVertical, Upload, Tag, ChevronDown
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

// Preset colors for quick selection
const PRESET_COLORS: ColorOption[] = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Red', hex: '#dc2626' },
    { name: 'Grey', hex: '#6b7280' },
    { name: 'Beige', hex: '#d4b896' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Brown', hex: '#78350f' },
];

// Image Color Info - stores both name and hex
interface ImageColorInfo {
    name: string;
    hex: string;
}

// Image Color Picker Component
interface ImageColorPickerProps {
    imageId: number;
    colorInfo: ImageColorInfo | null;
    onColorChange: (imageId: number, color: ImageColorInfo | null) => void;
}

function ImageColorPicker({ imageId, colorInfo, onColorChange }: ImageColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customHex, setCustomHex] = useState('#000000');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownContentRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Scroll dropdown into view when opened
    useEffect(() => {
        if (isOpen && dropdownContentRef.current) {
            // Small delay to ensure the dropdown is rendered
            setTimeout(() => {
                dropdownContentRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }, 50);
        }
    }, [isOpen]);

    const handlePresetSelect = (color: ColorOption) => {
        onColorChange(imageId, color);
        setIsOpen(false);
    };

    const handleCustomAdd = () => {
        if (customName.trim()) {
            onColorChange(imageId, { name: customName.trim(), hex: customHex });
            setCustomName('');
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        onColorChange(imageId, null);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors ${
                    colorInfo
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400'
                }`}
            >
                {colorInfo ? (
                    <>
                        <span
                            className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500"
                            style={{ backgroundColor: colorInfo.hex }}
                        />
                        <span className="max-w-[60px] truncate">{colorInfo.name}</span>
                    </>
                ) : (
                    <>
                        <Palette className="h-3 w-3" />
                        <span>Set color</span>
                    </>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    ref={dropdownContentRef}
                    className="absolute z-20 top-full mt-1 left-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                >
                    {/* Preset colors */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick select</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => handlePresetSelect(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                                        colorInfo?.name === color.name
                                            ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                                    }`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Custom color */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Custom color</p>
                        <div className="space-y-2">
                            {/* Name input row */}
                            <input
                                type="text"
                                placeholder="Name"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="w-full h-7 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                            />
                            {/* Color picker + Add button row */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        ref={colorInputRef}
                                        type="color"
                                        value={customHex}
                                        onChange={(e) => setCustomHex(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div
                                        className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:border-purple-400 transition-colors"
                                        style={{ backgroundColor: customHex }}
                                        onClick={() => colorInputRef.current?.click()}
                                        title="Click to pick color"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCustomAdd}
                                    disabled={!customName.trim()}
                                    className="flex-1 h-7 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Clear option */}
                    <div className="p-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            {colorInfo ? 'Remove color (show for all)' : 'No color (universal image)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Draggable Image Component for reordering
interface DraggableImageProps {
    image: { id: number; path: string; is_primary: boolean; sort_order: number; color?: string | null };
    productId: number;
    index: number;
    onDelete: (id: number) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    dragOverIndex: number | null;
    imageColorInfo: ImageColorInfo | null;
    onColorChange: (imageId: number, color: ImageColorInfo | null) => void;
}

function DraggableImage({ image, productId, index, onDelete, onDragStart, onDragOver, onDragEnd, isDragging, dragOverIndex, imageColorInfo, onColorChange }: DraggableImageProps) {
    return (
        <div className="flex flex-col items-center gap-2">
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
                {/* Color indicator badge */}
                {imageColorInfo && (
                    <span
                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: imageColorInfo.hex }}
                        title={imageColorInfo.name}
                    />
                )}
            </div>
            {/* Color picker */}
            <ImageColorPicker
                imageId={image.id}
                colorInfo={imageColorInfo}
                onColorChange={onColorChange}
            />
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
    type: 'text' | 'textarea' | 'boolean' | 'image' | 'select' | 'array' | 'json';
    old: string;
    new: string;
    old_path?: string;
    new_path?: string;
    old_id?: string | number;
    new_id?: string | number;
    old_count?: number;
    new_count?: number;
    old_data?: Record<string, number>;
    new_data?: Record<string, number>;
}

interface UndoMeta {
    available: boolean;
    saved_at: string;
    saved_by: number;
    saved_by_user?: {
        id: number;
        name: string;
        email: string;
    } | null;
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
    compare_price?: string;
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

    // Image colors state - tracks color assignment for each image (now stores full color info)
    const [imageColors, setImageColors] = useState<Record<number, ImageColorInfo | null>>({});

    // Real-time validation state
    const [liveErrors, setLiveErrors] = useState<ValidationErrors>({});

    // Sale percentage dropdown state
    const [showSaleDropdown, setShowSaleDropdown] = useState(false);
    const saleDropdownRef = useRef<HTMLDivElement>(null);

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
        image_colors: {} as Record<number, string | null>,
        // Variant fields
        color: product.color || '',
        color_hex: product.color_hex || '',
        available_colors: product.available_colors || [] as ColorOption[],
        available_sizes: product.available_sizes || [] as string[],
        size_stock: product.size_stock || {} as Record<string, number>,
        variant_stock: product.variant_stock || {} as VariantStock,
        product_group: product.product_group || '',
    };

    const { data, setData, errors, reset } = useForm(initialValues);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            image_colors: {},
            color: product.color || '',
            color_hex: product.color_hex || '',
            available_colors: product.available_colors || [],
            available_sizes: product.available_sizes || [],
            size_stock: product.size_stock || {},
            variant_stock: product.variant_stock || {},
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

    // Initialize image colors from product images (convert string color names to full color info)
    useEffect(() => {
        if (product.images && product.images.length > 0) {
            const colors: Record<number, ImageColorInfo | null> = {};
            product.images.forEach(img => {
                if (img.color) {
                    // Try to find hex from presets, or use a default
                    const preset = PRESET_COLORS.find(c => c.name.toLowerCase() === img.color?.toLowerCase());
                    colors[img.id] = {
                        name: img.color,
                        hex: preset?.hex || '#808080', // Default to grey if not found
                    };
                } else {
                    colors[img.id] = null;
                }
            });
            setImageColors(colors);
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

    // Check if image colors have changed (compare by color name)
    const originalImageColorNames = useMemo(() => {
        if (!product.images) return {};
        const colors: Record<number, string | null> = {};
        product.images.forEach(img => {
            colors[img.id] = img.color || null;
        });
        return colors;
    }, [product.images]);

    const imageColorsChanged = useMemo(() => {
        const currentKeys = Object.keys(imageColors);
        const originalKeys = Object.keys(originalImageColorNames);
        if (currentKeys.length !== originalKeys.length) return true;
        return currentKeys.some(key => {
            const currentColor = imageColors[Number(key)];
            const originalColor = originalImageColorNames[Number(key)];
            // Compare by name (what gets sent to backend)
            return (currentColor?.name || null) !== originalColor;
        });
    }, [imageColors, originalImageColorNames]);

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
        JSON.stringify(data.variant_stock) !== JSON.stringify(initialValues.variant_stock) ||
        data.images.length > 0 ||
        data.delete_images.length > 0 ||
        imageOrderChanged ||
        imageColorsChanged;

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

    // Handler for image color changes (now accepts full color info)
    const handleImageColorChange = useCallback((imageId: number, color: ImageColorInfo | null) => {
        setImageColors(prev => ({
            ...prev,
            [imageId]: color
        }));
    }, []);

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
        // Reconstruct full color info from original names
        const restoredColors: Record<number, ImageColorInfo | null> = {};
        Object.entries(originalImageColorNames).forEach(([id, colorName]) => {
            if (colorName) {
                const preset = PRESET_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase());
                restoredColors[Number(id)] = { name: colorName, hex: preset?.hex || '#808080' };
            } else {
                restoredColors[Number(id)] = null;
            }
        });
        setImageColors(restoredColors);
        setLiveErrors({});
        clearAutoSaveDraft();
        const fileInput = document.getElementById('edit_images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, [reset, originalImageOrder, originalImageColorNames]);

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
                if (hasChanges && !isSubmitting) {
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
    }, [hasChanges, isSubmitting, handleRevertChanges]);

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

    // Close sale dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (saleDropdownRef.current && !saleDropdownRef.current.contains(event.target as Node)) {
                setShowSaleDropdown(false);
            }
        };
        if (showSaleDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSaleDropdown]);

    // Auto-hide success message after 5 seconds
    useEffect(() => {
        if (showSuccess) {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
            successTimerRef.current = setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [showSuccess]);

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
        // Convert ImageColorInfo to just color names for backend
        const imageColorsForBackend: Record<number, string | null> = {};
        Object.entries(imageColors).forEach(([id, info]) => {
            imageColorsForBackend[parseInt(id)] = info?.name || null;
        });

        // Build FormData with all fields including image_order and image_colors
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('category_id', data.category_id);
        formData.append('name', data.name);
        formData.append('name_ar', data.name_ar);
        formData.append('slug', data.slug);
        formData.append('description', data.description);
        formData.append('description_ar', data.description_ar);
        formData.append('short_description', data.short_description);
        formData.append('short_description_ar', data.short_description_ar);
        formData.append('price', data.price);
        formData.append('compare_price', data.compare_price);
        formData.append('sku', data.sku);
        formData.append('stock', data.stock.toString());
        formData.append('low_stock_threshold', data.low_stock_threshold);
        formData.append('is_active', data.is_active ? '1' : '0');
        formData.append('is_featured', data.is_featured ? '1' : '0');
        formData.append('color', data.color);
        formData.append('color_hex', data.color_hex);
        formData.append('product_group', data.product_group);

        // Add sizes
        data.available_sizes.forEach((size, index) => {
            formData.append(`available_sizes[${index}]`, size);
        });

        // Add colors from images
        colorsFromImages.forEach((color, index) => {
            formData.append(`available_colors[${index}][name]`, color.name);
            formData.append(`available_colors[${index}][hex]`, color.hex);
        });

        // Add variant stock
        Object.entries(data.variant_stock).forEach(([key, value]) => {
            formData.append(`variant_stock[${key}]`, value.toString());
        });

        // Add size stock
        Object.entries(data.size_stock).forEach(([key, value]) => {
            formData.append(`size_stock[${key}]`, value.toString());
        });

        // Add image order
        imageOrder.forEach((id, index) => {
            formData.append(`image_order[${index}]`, id.toString());
        });

        // Add image colors
        Object.entries(imageColorsForBackend).forEach(([imageId, colorName]) => {
            formData.append(`image_colors[${imageId}]`, colorName || '');
        });

        // Add delete_images
        data.delete_images.forEach((id, index) => {
            formData.append(`delete_images[${index}]`, id.toString());
        });

        // Add new images
        data.images.forEach((file) => {
            formData.append('images[]', file);
        });

        setIsSubmitting(true);
        router.post(`/admin/products/${product.id}`, formData, {
            preserveScroll: true,
            forceFormData: true,
            onStart: () => {
                setIsSubmitting(true);
            },
            onSuccess: () => {
                clearAutoSaveDraft();
                setShowSuccess(true);
                // Clear file input
                const fileInput = document.getElementById('edit_images') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const MAX_IMAGES_PER_UPLOAD = 10;
    const MAX_TOTAL_IMAGES = 15;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Check per-upload limit
            if (newFiles.length > MAX_IMAGES_PER_UPLOAD) {
                alert(`You can only upload ${MAX_IMAGES_PER_UPLOAD} images at once. Please select fewer images.`);
                e.target.value = '';
                return;
            }

            // Calculate total after this upload
            const existingCount = existingImages.length;
            const deletedCount = data.delete_images.length;
            const alreadyQueuedCount = data.images.length;
            const totalAfterUpload = existingCount - deletedCount + alreadyQueuedCount + newFiles.length;

            if (totalAfterUpload > MAX_TOTAL_IMAGES) {
                const canAdd = MAX_TOTAL_IMAGES - (existingCount - deletedCount + alreadyQueuedCount);
                alert(`A product can have a maximum of ${MAX_TOTAL_IMAGES} images. You can add ${Math.max(0, canAdd)} more image(s).`);
                e.target.value = '';
                return;
            }

            // Append to existing new images instead of replacing
            setData('images', [...data.images, ...newFiles]);
        }
    };

    const handleDeleteImage = (imageId: number) => {
        setData('delete_images', [...data.delete_images, imageId]);
        // Also remove from imageOrder
        setImageOrder(prev => prev.filter(id => id !== imageId));

        // Remove the color assignment for this image
        const deletedColorInfo = imageColors[imageId];
        setImageColors(prev => {
            const updated = { ...prev };
            delete updated[imageId];
            return updated;
        });

        // If this was the only image with this color, clean up variant_stock for that color
        if (deletedColorInfo?.name) {
            const colorName = deletedColorInfo.name.toLowerCase();
            // Check if any other image has this color
            const otherImagesWithSameColor = Object.entries(imageColors).some(
                ([id, info]) => parseInt(id) !== imageId && info?.name?.toLowerCase() === colorName
            );

            if (!otherImagesWithSameColor) {
                // Remove all variant_stock entries for this color
                const colorKey = colorName.replace(/\s+/g, '_');
                const newVariantStock = { ...data.variant_stock };
                Object.keys(newVariantStock).forEach(key => {
                    if (key.startsWith(`${colorKey}_`)) {
                        delete newVariantStock[key];
                    }
                });
                setData('variant_stock', newVariantStock);
            }
        }
    };

    // Derive available colors from image color assignments
    const colorsFromImages = useMemo((): ColorOption[] => {
        const uniqueColors: ColorOption[] = [];
        const seenNames = new Set<string>();

        Object.values(imageColors).forEach(info => {
            if (info && info.name && !seenNames.has(info.name.toLowerCase())) {
                seenNames.add(info.name.toLowerCase());
                uniqueColors.push({ name: info.name, hex: info.hex });
            }
        });

        return uniqueColors;
    }, [imageColors]);

    // Track if we've migrated stock for this product session
    const hasMigratedStockRef = useRef(false);

    // Migrate old size_stock to variant_stock when colors are detected
    // This handles products that had size-only stock before the color×size system
    useEffect(() => {
        // Only migrate once per session
        if (hasMigratedStockRef.current) return;

        // Only migrate if:
        // 1. We have colors from images
        // 2. We have sizes
        // 3. We have old size_stock data with values
        // 4. variant_stock is empty or doesn't have keys for current colors
        if (colorsFromImages.length === 0) return;
        if (data.available_sizes.length === 0) return;

        const sizeStock = data.size_stock || {};
        const hasOldSizeStock = Object.keys(sizeStock).length > 0 &&
            Object.values(sizeStock).some(v => Number(v) > 0);

        if (!hasOldSizeStock) return;

        // Check if variant_stock already has keys for any current color
        const firstColor = colorsFromImages[0];
        const expectedKey = `${firstColor.name.toLowerCase().replace(/\s+/g, '_')}_${data.available_sizes[0]}`;
        const hasNewVariantStock = data.variant_stock && data.variant_stock[expectedKey] !== undefined;

        if (hasNewVariantStock) return;

        // Mark as migrated before setting state
        hasMigratedStockRef.current = true;

        // Migrate: put all old size_stock under the first color
        const migratedStock: VariantStock = {};
        data.available_sizes.forEach(size => {
            const oldValue = Number(sizeStock[size]) || 0;
            if (oldValue > 0) {
                const key = `${firstColor.name.toLowerCase().replace(/\s+/g, '_')}_${size}`;
                migratedStock[key] = oldValue;
            }
        });

        // Initialize zero stock for other colors
        colorsFromImages.slice(1).forEach(color => {
            data.available_sizes.forEach(size => {
                const key = `${color.name.toLowerCase().replace(/\s+/g, '_')}_${size}`;
                migratedStock[key] = 0;
            });
        });

        if (Object.keys(migratedStock).length > 0) {
            setData('variant_stock', migratedStock);
        }
    }, [colorsFromImages, data.available_sizes, data.size_stock, data.variant_stock]);

    // Sync main stock field with variant_stock total when variants exist
    useEffect(() => {
        // Only sync if we have both colors and sizes (variant mode)
        if (colorsFromImages.length === 0 || data.available_sizes.length === 0) return;

        const variantTotal = Object.values(data.variant_stock || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

        // Only update if different to avoid infinite loops
        if (data.stock !== variantTotal) {
            setData('stock', variantTotal);
        }
    }, [data.variant_stock, colorsFromImages.length, data.available_sizes.length]);

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
                            disabled={isSubmitting || !hasChanges}
                            className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
                            title="Ctrl+S"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Saving...' : 'Update Product'}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <Input
                                            label="Slug"
                                            value={data.slug}
                                            onChange={(e) => {
                                                setData('slug', e.target.value);
                                                handleFieldChange('slug', e.target.value);
                                            }}
                                            error={liveErrors.slug || errors.slug}
                                        />
                                    </div>

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
                                        {/* Price field with sale percentage dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Price <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative" ref={saleDropdownRef}>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.price}
                                                    onChange={(e) => {
                                                        setData('price', e.target.value);
                                                        handleFieldChange('price', e.target.value);
                                                        // Re-validate compare_price when price changes
                                                        if (data.compare_price) {
                                                            const price = parseFloat(e.target.value) || 0;
                                                            const comparePrice = parseFloat(data.compare_price) || 0;
                                                            if (comparePrice > 0 && comparePrice <= price) {
                                                                setLiveErrors(prev => ({ ...prev, compare_price: 'Must be higher than the selling price' }));
                                                            } else {
                                                                setLiveErrors(prev => ({ ...prev, compare_price: undefined }));
                                                            }
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-2 pr-24 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                        liveErrors.price || errors.price
                                                            ? 'border-red-500 dark:border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    required
                                                />
                                                {/* Apply Sale button - only show when compare_price is set */}
                                                {parseFloat(data.compare_price) > 0 && (() => {
                                                    const price = parseFloat(data.price) || 0;
                                                    const comparePrice = parseFloat(data.compare_price) || 0;
                                                    const hasSale = comparePrice > price && price > 0;
                                                    const currentDiscount = hasSale ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowSaleDropdown(!showSaleDropdown)}
                                                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                                                                hasSale
                                                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                                                                    : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60'
                                                            }`}
                                                        >
                                                            <Tag className="h-3 w-3" />
                                                            {hasSale ? `${currentDiscount}% Off` : 'Apply Sale'}
                                                        </button>
                                                    );
                                                })()}
                                                {/* Sale percentage dropdown */}
                                                {showSaleDropdown && parseFloat(data.compare_price) > 0 && (() => {
                                                    const currentPrice = parseFloat(data.price) || 0;
                                                    const comparePrice = parseFloat(data.compare_price) || 0;
                                                    const currentDiscountPercent = comparePrice > currentPrice && currentPrice > 0
                                                        ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
                                                        : 0;

                                                    return (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                                                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                                                {currentDiscountPercent > 0 ? 'Change discount %' : 'Select discount %'}
                                                            </div>
                                                            {[5, 10, 15, 20, 25, 30, 40, 50, 60, 70].map((percent) => {
                                                                const newPrice = (comparePrice * (1 - percent / 100)).toFixed(2);
                                                                const isActive = percent === currentDiscountPercent;
                                                                return (
                                                                    <button
                                                                        key={percent}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setData('price', newPrice);
                                                                            setLiveErrors(prev => ({ ...prev, compare_price: undefined }));
                                                                            setShowSaleDropdown(false);
                                                                        }}
                                                                        className={`w-full px-3 py-2 text-left text-sm flex justify-between items-center transition-colors ${
                                                                            isActive
                                                                                ? 'bg-green-50 dark:bg-green-900/20'
                                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                        }`}
                                                                    >
                                                                        <span className={`font-medium ${isActive ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
                                                                            {percent}% off {isActive && <Check className="h-3 w-3 inline ml-1" />}
                                                                        </span>
                                                                        <span className={isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>{newPrice} JOD</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            {(liveErrors.price || errors.price) && (
                                                <p className="mt-1 text-sm text-red-500">{liveErrors.price || errors.price}</p>
                                            )}
                                        </div>

                                        {/* Compare Price field with copy button */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Compare Price
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.compare_price}
                                                    onChange={(e) => {
                                                        setData('compare_price', e.target.value);
                                                        const comparePrice = parseFloat(e.target.value) || 0;
                                                        const price = parseFloat(data.price) || 0;
                                                        if (comparePrice > 0 && comparePrice <= price) {
                                                            setLiveErrors(prev => ({ ...prev, compare_price: 'Must be higher than the selling price' }));
                                                        } else {
                                                            setLiveErrors(prev => ({ ...prev, compare_price: undefined }));
                                                        }
                                                    }}
                                                    placeholder="Original price before discount"
                                                    className={`w-full px-3 py-2 pr-28 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                        liveErrors.compare_price || errors.compare_price
                                                            ? 'border-red-500 dark:border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                />
                                                {/* Copy price button - show when price exists and compare_price is empty */}
                                                {parseFloat(data.price) > 0 && !data.compare_price && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('compare_price', data.price);
                                                            setLiveErrors(prev => ({ ...prev, compare_price: undefined }));
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors flex items-center gap-1"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        Copy Price
                                                    </button>
                                                )}
                                                {/* Clear button - show when compare_price is set */}
                                                {data.compare_price && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('compare_price', '');
                                                            setLiveErrors(prev => ({ ...prev, compare_price: undefined }));
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            {(liveErrors.compare_price || errors.compare_price) && (
                                                <p className="mt-1 text-sm text-red-500">{liveErrors.compare_price || errors.compare_price}</p>
                                            )}
                                            {/* Helper indicator */}
                                            {(() => {
                                                const price = parseFloat(data.price) || 0;
                                                const comparePrice = parseFloat(data.compare_price) || 0;

                                                if (!data.compare_price || comparePrice === 0) {
                                                    return (
                                                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                            Click "Copy Price" to start setting up a sale.
                                                        </p>
                                                    );
                                                }

                                                if (comparePrice > price && price > 0) {
                                                    const discountPercent = Math.round(((comparePrice - price) / comparePrice) * 100);
                                                    const savings = (comparePrice - price).toFixed(2);
                                                    return (
                                                        <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                            <Check className="h-3 w-3" />
                                                            {discountPercent}% off (saves {savings} JOD)
                                                        </p>
                                                    );
                                                }

                                                if (comparePrice > 0 && comparePrice === price) {
                                                    return (
                                                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                            Now use "Apply Sale" on the Price field or manually reduce it.
                                                        </p>
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </div>
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
                                        <div>
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
                                                disabled={colorsFromImages.length > 0 && data.available_sizes.length > 0}
                                            />
                                            {colorsFromImages.length > 0 && data.available_sizes.length > 0 && (
                                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Auto-calculated from variant stock below
                                                </p>
                                            )}
                                        </div>
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
                                        Optional: Add color and size variants with stock tracking per combination
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <VariantStockEditor
                                        colors={colorsFromImages}
                                        sizes={data.available_sizes}
                                        variantStock={data.variant_stock}
                                        onColorsChange={() => {}} // Colors are derived from images, not editable here
                                        onSizesChange={(sizes) => setData('available_sizes', sizes)}
                                        onVariantStockChange={(stock) => setData('variant_stock', stock)}
                                        error={errors.available_colors || errors.available_sizes || errors.variant_stock}
                                        colorsFromImages={true}
                                    />
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
                                                    imageColorInfo={imageColors[image.id] ?? null}
                                                    onColorChange={handleImageColorChange}
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
                                            Add more images (max {MAX_IMAGES_PER_UPLOAD} per upload, {MAX_TOTAL_IMAGES} total limit) — Currently: {existingImages.length - data.delete_images.length + data.images.length} / {MAX_TOTAL_IMAGES}
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
                                <CardContent className="space-y-4">
                                    {/* Status Toggles */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('is_active', !data.is_active)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                                                data.is_active
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                        >
                                            {data.is_active ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full border-2 border-current" />
                                            )}
                                            Active
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('is_featured', !data.is_featured)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                                                data.is_featured
                                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                        >
                                            {data.is_featured ? (
                                                <Star className="h-4 w-4 fill-current" />
                                            ) : (
                                                <Star className="h-4 w-4" />
                                            )}
                                            Featured
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 dark:border-gray-700" />

                                    {/* Action Links */}
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
                                    {/* SEO Analysis */}
                                    {(() => {
                                        const titleLength = data.name?.length || 0;
                                        const shortDescLength = data.short_description?.length || 0;
                                        const descLength = data.description?.length || 0;
                                        const hasArabicName = !!data.name_ar;
                                        const hasArabicDesc = !!data.short_description_ar;

                                        const checks = {
                                            titleExists: titleLength > 0,
                                            titleGoodLength: titleLength >= 20 && titleLength <= 60,
                                            titleNotTooLong: titleLength <= 60,
                                            shortDescExists: shortDescLength > 0,
                                            shortDescGoodLength: shortDescLength >= 50 && shortDescLength <= 160,
                                            shortDescNotTooLong: shortDescLength <= 160,
                                            descExists: descLength > 0,
                                        };

                                        const passedChecks = Object.values(checks).filter(Boolean).length;
                                        const totalChecks = Object.keys(checks).length;
                                        const score = Math.round((passedChecks / totalChecks) * 100);

                                        return (
                                            <div className="mt-3 space-y-3">
                                                {/* SEO Score */}
                                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">SEO Score</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all ${
                                                                    score >= 80 ? 'bg-green-500' :
                                                                    score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${score}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-bold ${
                                                            score >= 80 ? 'text-green-600 dark:text-green-400' :
                                                            score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                            {score}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detailed Checks */}
                                                <div className="space-y-1.5">
                                                    {/* Title Checks */}
                                                    {!checks.titleExists ? (
                                                        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Title missing:</strong> Add a product name for search engines to index</span>
                                                        </div>
                                                    ) : titleLength < 20 ? (
                                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Title too short ({titleLength}/20+ chars):</strong> Add more descriptive keywords to improve searchability</span>
                                                        </div>
                                                    ) : titleLength > 60 ? (
                                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Title too long ({titleLength}/60 chars):</strong> May be truncated in search results. Keep under 60 characters</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Title length good</strong> ({titleLength} chars)</span>
                                                        </div>
                                                    )}

                                                    {/* Short Description Checks */}
                                                    {!checks.shortDescExists ? (
                                                        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Meta description missing:</strong> Add a short description (50-160 chars) for search result snippets</span>
                                                        </div>
                                                    ) : shortDescLength < 50 ? (
                                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Meta description short ({shortDescLength}/50+ chars):</strong> Expand to 50-160 characters for better click-through rates</span>
                                                        </div>
                                                    ) : shortDescLength > 160 ? (
                                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Meta description long ({shortDescLength}/160 chars):</strong> Will be truncated in search results</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Meta description good</strong> ({shortDescLength} chars)</span>
                                                        </div>
                                                    )}

                                                    {/* Full Description Check */}
                                                    {!checks.descExists ? (
                                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Full description missing:</strong> Detailed content helps with search rankings</span>
                                                        </div>
                                                    ) : descLength < 100 ? (
                                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Description brief ({descLength} chars):</strong> Consider adding more product details</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Full description good</strong> ({descLength} chars)</span>
                                                        </div>
                                                    )}

                                                    {/* Arabic Localization */}
                                                    {(!hasArabicName || !hasArabicDesc) && (
                                                        <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
                                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span><strong>Arabic SEO:</strong> Add {!hasArabicName && 'Arabic name'}{!hasArabicName && !hasArabicDesc && ' and '}{!hasArabicDesc && 'Arabic description'} to reach Arabic-speaking customers</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
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
                                                <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                Last Update
                                                            </span>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                            {undoMeta.changes.length} change{undoMeta.changes.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                        <span>{formatDate(undoMeta.saved_at)}</span>
                                                        {undoMeta.saved_by_user && (
                                                            <>
                                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                                <span className="text-gray-600 dark:text-gray-300 font-medium" title={undoMeta.saved_by_user.email}>
                                                                    {undoMeta.saved_by_user.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {undoMeta.changes.slice(0, 4).map((change, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1">
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[100px]">
                                                                    {change.label}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                    change.type === 'boolean' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                                                                    change.type === 'array' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                                    change.type === 'json' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                                                    'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                                }`}>
                                                                    {change.type === 'boolean' ? 'Toggle' :
                                                                     change.type === 'array' ? 'List' :
                                                                     change.type === 'json' ? 'Data' :
                                                                     'Text'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {undoMeta.changes.length > 4 && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                                +{undoMeta.changes.length - 4} more
                                                            </p>
                                                        )}
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
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {isSubmitting ? 'Saving...' : 'Save'}
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
