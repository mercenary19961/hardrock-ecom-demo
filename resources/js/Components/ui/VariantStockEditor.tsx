import { useId, useState, useRef } from 'react';
import { Plus, X, Ruler, Package, Palette, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorOption {
    name: string;
    hex: string;
}

interface VariantStock {
    [colorSize: string]: number;
}

interface VariantStockEditorProps {
    colors: ColorOption[];  // Colors derived from images (read-only from this component)
    sizes: string[];
    variantStock: VariantStock;
    onColorsChange: (colors: ColorOption[]) => void;
    onSizesChange: (sizes: string[]) => void;
    onVariantStockChange: (variantStock: VariantStock) => void;
    error?: string;
    // New prop: are colors read-only (derived from images)?
    colorsFromImages?: boolean;
}

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const NUMERIC_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

// Helper to create variant key
function createVariantKey(colorName: string, size: string): string {
    return `${colorName.toLowerCase().replace(/\s+/g, '_')}_${size}`;
}

export function VariantStockEditor({
    colors,
    sizes,
    variantStock,
    onColorsChange,
    onSizesChange,
    onVariantStockChange,
    error,
    colorsFromImages = true,  // Default to new behavior
}: VariantStockEditorProps) {
    const customSizeId = useId();
    const [showSizePresets, setShowSizePresets] = useState(false);

    // Add a size
    const addSize = (size: string) => {
        if (!size.trim() || sizes.includes(size.trim())) return;

        const newSize = size.trim().toUpperCase();
        onSizesChange([...sizes, newSize]);

        // Initialize stock for all colors with this size
        const newStock = { ...variantStock };
        colors.forEach(color => {
            const key = createVariantKey(color.name, newSize);
            if (newStock[key] === undefined) {
                newStock[key] = 0;
            }
        });
        onVariantStockChange(newStock);
    };

    // Remove a size
    const removeSize = (sizeToRemove: string) => {
        onSizesChange(sizes.filter(s => s !== sizeToRemove));
        // Remove all stock entries for this size
        const newStock = { ...variantStock };
        colors.forEach(color => {
            const key = createVariantKey(color.name, sizeToRemove);
            delete newStock[key];
        });
        onVariantStockChange(newStock);
    };

    // Update stock for a specific variant
    const updateStock = (colorName: string, size: string, stock: number) => {
        const key = createVariantKey(colorName, size);
        onVariantStockChange({ ...variantStock, [key]: Math.max(0, stock) });
    };

    // Get stock for a specific variant
    const getStock = (colorName: string, size: string): number => {
        const key = createVariantKey(colorName, size);
        return variantStock[key] ?? 0;
    };

    // Calculate totals
    const getTotalStock = () => Object.values(variantStock).reduce((a, b) => a + b, 0);
    const getColorTotal = (colorName: string) => {
        return sizes.reduce((total, size) => total + getStock(colorName, size), 0);
    };
    const getSizeTotal = (size: string) => {
        return colors.reduce((total, color) => total + getStock(color.name, size), 0);
    };

    // Handle custom size key down
    const handleCustomSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSize(e.currentTarget.value);
            e.currentTarget.value = '';
        }
    };

    // Add all letter presets
    const addAllLetterSizes = () => {
        const newSizes = PRESET_SIZES.filter(s => !sizes.includes(s));
        if (newSizes.length === 0) return;

        onSizesChange([...sizes, ...newSizes]);
        const newStock = { ...variantStock };
        colors.forEach(color => {
            newSizes.forEach(size => {
                const key = createVariantKey(color.name, size);
                newStock[key] = 0;
            });
        });
        onVariantStockChange(newStock);
    };

    // Add all numeric presets
    const addAllNumericSizes = () => {
        const newSizes = NUMERIC_SIZES.filter(s => !sizes.includes(s));
        if (newSizes.length === 0) return;

        onSizesChange([...sizes, ...newSizes]);
        const newStock = { ...variantStock };
        colors.forEach(color => {
            newSizes.forEach(size => {
                const key = createVariantKey(color.name, size);
                newStock[key] = 0;
            });
        });
        onVariantStockChange(newStock);
    };

    // Clear all sizes and stock
    const clearSizes = () => {
        onSizesChange([]);
        onVariantStockChange({});
    };

    const hasColors = colors.length > 0;
    const hasSizes = sizes.length > 0;
    const hasVariants = hasColors && hasSizes;

    return (
        <div className="w-full space-y-6">
            {/* Colors Section - Read-only display when colors come from images */}
            {colorsFromImages && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Colors
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            (from images below)
                        </span>
                    </div>

                    {hasColors ? (
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <div
                                    key={color.name}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                                >
                                    <span
                                        className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="text-sm text-purple-700 dark:text-purple-300">
                                        {color.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>Tag your images with colors in the Images section below to add color variants.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Sizes Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sizes
                        </span>
                    </div>
                    {hasSizes && (
                        <button
                            type="button"
                            onClick={clearSizes}
                            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Selected Sizes */}
                {hasSizes && (
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                            <div
                                key={size}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                            >
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                    {size}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeSize(size)}
                                    className="text-blue-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Size Controls */}
                <div className="space-y-3">
                    {/* Toggle to show presets */}
                    {!showSizePresets ? (
                        <button
                            type="button"
                            onClick={() => setShowSizePresets(true)}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Add sizes
                        </button>
                    ) : (
                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Sizes</span>
                                <button
                                    type="button"
                                    onClick={() => setShowSizePresets(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Letter Size Presets */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Letter Sizes</span>
                                    <button
                                        type="button"
                                        onClick={addAllLetterSizes}
                                        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                                    >
                                        Add All
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => addSize(size)}
                                            disabled={sizes.includes(size)}
                                            className={cn(
                                                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                                                sizes.includes(size)
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 cursor-not-allowed'
                                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                            )}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Numeric Size Presets */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Numeric Sizes (Shoes)</span>
                                    <button
                                        type="button"
                                        onClick={addAllNumericSizes}
                                        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                                    >
                                        Add All
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {NUMERIC_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => addSize(size)}
                                            disabled={sizes.includes(size)}
                                            className={cn(
                                                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                                                sizes.includes(size)
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 cursor-not-allowed'
                                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                            )}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Size Input */}
                            <div>
                                <label htmlFor={customSizeId} className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Custom Size
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id={customSizeId}
                                        type="text"
                                        placeholder="Enter custom size"
                                        onKeyDown={handleCustomSizeKeyDown}
                                        className="flex h-9 flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            addSize(input.value);
                                            input.value = '';
                                        }}
                                        className="px-4 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stock Matrix */}
            {hasVariants && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Stock Matrix ({colors.length} colors × {sizes.length} sizes)
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 sticky left-0 z-10">
                                        Color / Size
                                    </th>
                                    {sizes.map((size) => (
                                        <th
                                            key={size}
                                            className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-w-[70px]"
                                        >
                                            {size}
                                        </th>
                                    ))}
                                    <th className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 min-w-[60px]">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {colors.map((color) => (
                                    <tr key={color.name}>
                                        <td className="p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky left-0 z-10">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                                                    {color.name}
                                                </span>
                                            </div>
                                        </td>
                                        {sizes.map((size) => (
                                            <td
                                                key={`${color.name}-${size}`}
                                                className="p-1 border border-gray-200 dark:border-gray-700"
                                            >
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={getStock(color.name, size)}
                                                    onChange={(e) =>
                                                        updateStock(color.name, size, parseInt(e.target.value) || 0)
                                                    }
                                                    className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 text-sm text-center text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                                            {getColorTotal(color.name)}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="p-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 sticky left-0 z-10">
                                        Total
                                    </td>
                                    {sizes.map((size) => (
                                        <td
                                            key={`total-${size}`}
                                            className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700"
                                        >
                                            {getSizeTotal(size)}
                                        </td>
                                    ))}
                                    <td className="p-2 text-center text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-gray-200 dark:border-gray-700">
                                        {getTotalStock()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State - only for sizes (colors come from images) */}
            {!hasSizes && hasColors && (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <Ruler className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add sizes to create the stock matrix.
                    </p>
                </div>
            )}

            {/* Empty State - no colors yet */}
            {!hasColors && colorsFromImages && (
                <div className="text-center py-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-dashed border-amber-300 dark:border-amber-700">
                    <Palette className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Scroll down to the Images section and tag your images with colors to enable variant stock.
                    </p>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
