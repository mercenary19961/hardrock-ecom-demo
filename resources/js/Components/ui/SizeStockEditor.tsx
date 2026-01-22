import { useId } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SizeStock {
    [size: string]: number;
}

interface SizeStockEditorProps {
    sizes: string[];
    sizeStock: SizeStock;
    onSizesChange: (sizes: string[]) => void;
    onSizeStockChange: (sizeStock: SizeStock) => void;
    error?: string;
    label?: string;
}

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const NUMERIC_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

export function SizeStockEditor({
    sizes,
    sizeStock,
    onSizesChange,
    onSizeStockChange,
    error,
    label = 'Sizes & Stock',
}: SizeStockEditorProps) {
    const customSizeId = useId();

    const addSize = (size: string) => {
        if (!size.trim() || sizes.includes(size.trim())) return;

        const newSize = size.trim().toUpperCase();
        onSizesChange([...sizes, newSize]);
        onSizeStockChange({ ...sizeStock, [newSize]: 0 });
    };

    const removeSize = (sizeToRemove: string) => {
        onSizesChange(sizes.filter((s) => s !== sizeToRemove));
        const newStock = { ...sizeStock };
        delete newStock[sizeToRemove];
        onSizeStockChange(newStock);
    };

    const updateStock = (size: string, stock: number) => {
        onSizeStockChange({ ...sizeStock, [size]: Math.max(0, stock) });
    };

    const handleCustomSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.currentTarget;
            addSize(input.value);
            input.value = '';
        }
    };

    const addAllPresets = (presets: string[]) => {
        const newSizes = presets.filter((s) => !sizes.includes(s));
        if (newSizes.length === 0) return;

        onSizesChange([...sizes, ...newSizes]);
        const newStock = { ...sizeStock };
        newSizes.forEach((s) => {
            newStock[s] = 0;
        });
        onSizeStockChange(newStock);
    };

    const clearAll = () => {
        onSizesChange([]);
        onSizeStockChange({});
    };

    return (
        <div className="w-full space-y-4">
            {label && (
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </span>
            )}

            {/* Size Presets */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Letter Sizes</span>
                    <button
                        type="button"
                        onClick={() => addAllPresets(PRESET_SIZES)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                            )}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Numeric Sizes (Shoes)</span>
                    <button
                        type="button"
                        onClick={() => addAllPresets(NUMERIC_SIZES)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                            )}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Size Input */}
            <div>
                <label htmlFor={customSizeId} className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Custom Size
                </label>
                <div className="flex gap-2">
                    <input
                        id={customSizeId}
                        type="text"
                        placeholder="Enter custom size"
                        onKeyDown={handleCustomSizeKeyDown}
                        className="flex h-10 flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addSize(input.value);
                            input.value = '';
                        }}
                        className="px-4 h-10 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Selected Sizes with Stock */}
            {sizes.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Stock per Size ({sizes.length} sizes)
                        </span>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {sizes.map((size) => (
                            <div
                                key={size}
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[40px]">
                                    {size}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={sizeStock[size] ?? 0}
                                    onChange={(e) => updateStock(size, parseInt(e.target.value) || 0)}
                                    className="flex-1 h-8 w-full min-w-0 rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 px-2 text-sm text-center text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSize(size)}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total stock: {Object.values(sizeStock).reduce((a, b) => a + b, 0)} units
                    </p>
                </div>
            )}

            {sizes.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No sizes selected. Click on size buttons above or add a custom size.
                </p>
            )}

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
