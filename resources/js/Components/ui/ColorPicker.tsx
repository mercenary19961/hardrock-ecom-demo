import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
    colorName: string;
    colorHex: string;
    onColorNameChange: (value: string) => void;
    onColorHexChange: (value: string) => void;
    error?: string;
    label?: string;
}

const PRESET_COLORS = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#22C55E' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Gray', hex: '#6B7280' },
    { name: 'Navy', hex: '#1E3A5F' },
    { name: 'Beige', hex: '#F5F5DC' },
];

export function ColorPicker({
    colorName,
    colorHex,
    onColorNameChange,
    onColorHexChange,
    error,
    label = 'Color',
}: ColorPickerProps) {
    const nameId = useId();
    const hexId = useId();

    const handlePresetClick = (preset: { name: string; hex: string }) => {
        onColorNameChange(preset.name);
        onColorHexChange(preset.hex);
    };

    const handleHexChange = (value: string) => {
        // Ensure the value starts with # and only contains valid hex characters
        let hex = value;
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }
        // Remove any invalid characters
        hex = '#' + hex.slice(1).replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
        onColorHexChange(hex);
    };

    return (
        <div className="w-full space-y-3">
            {label && (
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </span>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Color Name Input */}
                <div>
                    <label
                        htmlFor={nameId}
                        className="block text-sm text-gray-600 dark:text-gray-400 mb-1"
                    >
                        Color Name
                    </label>
                    <input
                        id={nameId}
                        type="text"
                        value={colorName}
                        onChange={(e) => onColorNameChange(e.target.value)}
                        placeholder="e.g., Black, Navy Blue"
                        className={cn(
                            'flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400',
                            error && 'border-red-500 focus:border-red-500'
                        )}
                    />
                </div>

                {/* Hex Input with Preview */}
                <div>
                    <label
                        htmlFor={hexId}
                        className="block text-sm text-gray-600 dark:text-gray-400 mb-1"
                    >
                        Hex Code
                    </label>
                    <div className="flex gap-2">
                        <div
                            className="h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0"
                            style={{
                                backgroundColor: colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : '#FFFFFF',
                            }}
                        />
                        <input
                            id={hexId}
                            type="text"
                            value={colorHex}
                            onChange={(e) => handleHexChange(e.target.value)}
                            placeholder="#000000"
                            maxLength={7}
                            className={cn(
                                'flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400',
                                error && 'border-red-500 focus:border-red-500'
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Color Presets */}
            <div>
                <span className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Quick Select
                </span>
                <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((preset) => (
                        <button
                            key={preset.hex}
                            type="button"
                            onClick={() => handlePresetClick(preset)}
                            className={cn(
                                'w-8 h-8 rounded-lg border-2 transition-all hover:scale-110',
                                colorHex === preset.hex
                                    ? 'border-gray-900 dark:border-white ring-2 ring-gray-400 dark:ring-gray-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            )}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                        />
                    ))}
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
