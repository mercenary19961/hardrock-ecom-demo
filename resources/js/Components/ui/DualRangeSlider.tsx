import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
    step = 1,
    formatValue = (v) => v.toString(),
    className,
}: DualRangeSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
    const [localMin, setLocalMin] = useState(minValue);
    const [localMax, setLocalMax] = useState(maxValue);

    // Sync local state with props when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalMin(minValue);
            setLocalMax(maxValue);
        }
    }, [minValue, maxValue, isDragging]);

    const getPercentage = (value: number) => {
        return ((value - min) / (max - min)) * 100;
    };

    const getValueFromPosition = useCallback((clientX: number) => {
        if (!trackRef.current) return min;

        const rect = trackRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const rawValue = min + percentage * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        return Math.max(min, Math.min(max, steppedValue));
    }, [min, max, step]);

    const handleMouseDown = (handle: 'min' | 'max') => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(handle);
    };

    const handleTouchStart = (handle: 'min' | 'max') => (e: React.TouchEvent) => {
        e.stopPropagation();
        setIsDragging(handle);
    };

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging) return;

        const newValue = getValueFromPosition(clientX);

        if (isDragging === 'min') {
            const clampedValue = Math.min(newValue, localMax - step);
            setLocalMin(clampedValue);
            onChange(clampedValue, localMax);
        } else {
            const clampedValue = Math.max(newValue, localMin + step);
            setLocalMax(clampedValue);
            onChange(localMin, clampedValue);
        }
    }, [isDragging, localMin, localMax, step, onChange, getValueFromPosition]);

    const handleEnd = useCallback(() => {
        if (isDragging && onChangeEnd) {
            onChangeEnd(localMin, localMax);
        }
        setIsDragging(null);
    }, [isDragging, localMin, localMax, onChangeEnd]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            handleMove(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX);
            }
        };

        const handleMouseUp = () => handleEnd();
        const handleTouchEnd = () => handleEnd();

        // Use passive: false to prevent scroll while dragging
        document.addEventListener('mousemove', handleMouseMove, { passive: false });
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMove, handleEnd]);

    const handleTrackClick = (e: React.MouseEvent) => {
        if (isDragging) return;

        const clickValue = getValueFromPosition(e.clientX);
        const distToMin = Math.abs(clickValue - localMin);
        const distToMax = Math.abs(clickValue - localMax);

        if (distToMin < distToMax && clickValue < localMax - step) {
            setLocalMin(clickValue);
            onChange(clickValue, localMax);
            onChangeEnd?.(clickValue, localMax);
        } else if (clickValue > localMin + step) {
            setLocalMax(clickValue);
            onChange(localMin, clickValue);
            onChangeEnd?.(localMin, clickValue);
        }
    };

    const minPercent = getPercentage(localMin);
    const maxPercent = getPercentage(localMax);

    return (
        <div className={cn('space-y-3', className)}>
            {/* Value display */}
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{formatValue(localMin)}</span>
                <span className="text-gray-400">—</span>
                <span className="font-medium text-gray-900">{formatValue(localMax)}</span>
            </div>

            {/* Slider track */}
            <div
                ref={trackRef}
                className="relative h-8 flex items-center cursor-pointer select-none"
                onClick={handleTrackClick}
            >
                {/* Background track */}
                <div className="absolute inset-x-0 h-1 bg-gray-200 rounded-full" />

                {/* Active range */}
                <div
                    className="absolute h-1 bg-gray-400 rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`,
                    }}
                />

                {/* Min handle */}
                <div
                    className={cn(
                        'absolute w-5 h-5 bg-white border-2 border-gray-400 rounded-full shadow-md cursor-grab transform -translate-x-1/2 transition-shadow z-10',
                        isDragging === 'min' && 'cursor-grabbing ring-2 ring-gray-400/30 border-gray-500 scale-110',
                        'hover:ring-2 hover:ring-gray-400/30 hover:border-gray-500'
                    )}
                    style={{ left: `${minPercent}%` }}
                    onMouseDown={handleMouseDown('min')}
                    onTouchStart={handleTouchStart('min')}
                    role="slider"
                    aria-label="Minimum price"
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={localMin}
                    tabIndex={0}
                />

                {/* Max handle */}
                <div
                    className={cn(
                        'absolute w-5 h-5 bg-white border-2 border-gray-400 rounded-full shadow-md cursor-grab transform -translate-x-1/2 transition-shadow z-10',
                        isDragging === 'max' && 'cursor-grabbing ring-2 ring-gray-400/30 border-gray-500 scale-110',
                        'hover:ring-2 hover:ring-gray-400/30 hover:border-gray-500'
                    )}
                    style={{ left: `${maxPercent}%` }}
                    onMouseDown={handleMouseDown('max')}
                    onTouchStart={handleTouchStart('max')}
                    role="slider"
                    aria-label="Maximum price"
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={localMax}
                    tabIndex={0}
                />
            </div>
        </div>
    );
}
