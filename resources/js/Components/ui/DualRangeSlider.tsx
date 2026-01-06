import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
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

export function DualRangeSlider({
    min,
    max,
    minValue,
    maxValue,
    onChange,
    onChangeEnd,
    className,
}: DualRangeSliderProps) {
    const [localMin, setLocalMin] = useState(Math.floor(minValue).toString());
    const [localMax, setLocalMax] = useState(Math.ceil(maxValue).toString());

    // Sync with props
    useEffect(() => {
        setLocalMin(Math.floor(minValue).toString());
        setLocalMax(Math.ceil(maxValue).toString());
    }, [minValue, maxValue]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMin(e.target.value);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMax(e.target.value);
    };

    const handleApply = () => {
        let newMin = parseInt(localMin) || min;
        let newMax = parseInt(localMax) || max;

        // Clamp values
        newMin = Math.max(min, Math.min(newMin, max));
        newMax = Math.max(min, Math.min(newMax, max));

        // Ensure min <= max
        if (newMin > newMax) {
            [newMin, newMax] = [newMax, newMin];
        }

        setLocalMin(newMin.toString());
        setLocalMax(newMax.toString());
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
                        type="number"
                        value={localMin}
                        onChange={handleMinChange}
                        onKeyDown={handleKeyDown}
                        min={min}
                        max={max}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="Min"
                    />
                </div>
                <span className="text-gray-400">—</span>
                <div className="flex-1">
                    <input
                        type="number"
                        value={localMax}
                        onChange={handleMaxChange}
                        onKeyDown={handleKeyDown}
                        min={min}
                        max={max}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="Max"
                    />
                </div>
            </div>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleApply}
                className="w-full"
            >
                Apply
            </Button>
        </div>
    );
}
