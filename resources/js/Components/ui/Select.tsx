import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
    isChild?: boolean;
}

export interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    id?: string;
    name?: string;
    label?: string;
}

export function Select({ value, onChange, options, placeholder = 'Select...', className, id, name, label }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const generatedId = useId();
    const selectId = id || generatedId;

    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            {/* Hidden input for form submission */}
            <input type="hidden" id={selectId} name={name} value={value} />
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={label ? selectId : undefined}
                className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-left',
                    'focus:outline-none focus:border-gray-900',
                    'hover:border-gray-400 transition-colors',
                    isOpen && 'border-gray-900'
                )}
            >
                <span className={cn('flex items-center truncate', !selectedOption && 'text-gray-500')}>
                    {selectedOption?.isChild && (
                        <CornerDownRight className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    )}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-gray-500 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2 text-left text-sm',
                                'hover:bg-gray-100 transition-colors',
                                option.value === value && 'bg-gray-50 font-medium'
                            )}
                        >
                            <span className="flex items-center truncate">
                                {option.isChild && (
                                    <CornerDownRight className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                )}
                                {option.label}
                            </span>
                            {option.value === value && (
                                <Check className="h-4 w-4 text-gray-900 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
