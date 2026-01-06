import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumber } from '@/lib/utils';
import { Button } from '@/Components/ui/Button';

interface DualRangeSliderProps {
    min: number;
    max: number;
    minValue: number;
    maxValue: number;
    onChange: (min: number, max: number) => void;
    onChangeEnd?: (min: number, max: number) => void;
    step?: number;
    formatValue?: (value: number) => string;
    className?: string;
}

// Convert Arabic numerals to Western numerals for parsing
function parseArabicNumber(str: string): number {
    const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
    let result = '';
    for (const char of str) {
        const index = arabicNumerals.indexOf(char);
        if (index !== -1) {
            result += index.toString();
        } else if (/[0-9]/.test(char)) {
            result += char;
        }
    }
    return parseInt(result) || 0;
}

export function DualRangeSlider({
    min,
    max,
    minValue,
    maxValue,
    onChange,
    onChangeEnd,
    className,
}: DualRangeSliderProps) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const [localMin, setLocalMin] = useState(formatNumber(Math.floor(minValue), language));
    const [localMax, setLocalMax] = useState(formatNumber(Math.ceil(maxValue), language));

    // Sync with props
    useEffect(() => {
        setLocalMin(formatNumber(Math.floor(minValue), language));
        setLocalMax(formatNumber(Math.ceil(maxValue), language));
    }, [minValue, maxValue, language]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMin(e.target.value);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMax(e.target.value);
    };

    const handleApply = () => {
        let newMin = parseArabicNumber(localMin) || min;
        let newMax = parseArabicNumber(localMax) || max;

        // Clamp values
        newMin = Math.max(min, Math.min(newMin, max));
        newMax = Math.max(min, Math.min(newMax, max));

        // Ensure min <= max
        if (newMin > newMax) {
            [newMin, newMax] = [newMax, newMin];
        }

        setLocalMin(formatNumber(newMin, language));
        setLocalMax(formatNumber(newMax, language));
        onChange(newMin, newMax);
        onChangeEnd?.(newMin, newMax);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={localMin}
                        onChange={handleMinChange}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder={t('shop:min')}
                    />
                </div>
                <span className="text-gray-400">—</span>
                <div className="flex-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={localMax}
                        onChange={handleMaxChange}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder={t('shop:max')}
                    />
                </div>
            </div>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleApply}
                className="w-full"
            >
                {t('shop:apply')}
            </Button>
        </div>
    );
}
