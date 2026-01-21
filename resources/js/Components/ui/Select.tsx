import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, ChevronRight, Check, CornerDownRight, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
    isChild?: boolean;
    isGroupHeader?: boolean;
    childCount?: number;
    parentValue?: string; // Links child to its parent for collapsible behavior
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
    dropdownPosition?: 'top' | 'bottom';
}

export function Select({ value, onChange, options, placeholder = 'Select...', className, id, name, label, dropdownPosition = 'bottom' }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);
    const generatedId = useId();
    const selectId = id || generatedId;

    const selectedOption = options.find(opt => opt.value === value);

    // Auto-expand the parent group if a child is selected
    useEffect(() => {
        if (value) {
            const selectedOpt = options.find(opt => opt.value === value);
            if (selectedOpt?.parentValue) {
                setExpandedGroups(prev => new Set([...prev, selectedOpt.parentValue!]));
            }
        }
    }, [value, options]);

    const toggleGroup = (groupValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupValue)) {
                newSet.delete(groupValue);
            } else {
                newSet.add(groupValue);
            }
            return newSet;
        });
    };

    const isGroupExpanded = (groupValue: string) => expandedGroups.has(groupValue);

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
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
                    'w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-left',
                    'focus:outline-none focus:border-gray-900 dark:focus:border-gray-400',
                    'hover:border-gray-400 dark:hover:border-gray-500 transition-colors',
                    isOpen && 'border-gray-900 dark:border-gray-400'
                )}
            >
                <span className={cn('flex items-center truncate', !selectedOption && 'text-gray-500 dark:text-gray-400')}>
                    {selectedOption?.isChild && (
                        <CornerDownRight className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    )}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={cn(
                    'h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform',
                    dropdownPosition === 'top'
                        ? (isOpen ? '' : 'rotate-180')
                        : (isOpen ? 'rotate-180' : '')
                )} />
            </button>

            {isOpen && (
                <div className={cn(
                    "absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto",
                    dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
                )}>
                    {options.map((option) => {
                        // Group header (parent category) - selectable with expand/collapse button
                        if (option.isGroupHeader) {
                            const hasChildren = option.childCount !== undefined && option.childCount > 0;
                            const isExpanded = isGroupExpanded(option.value);

                            return (
                                <div
                                    key={option.value}
                                    className={cn(
                                        'flex items-center border-t border-gray-100 dark:border-gray-700 first:border-t-0',
                                        option.value === value && 'bg-purple-50 dark:bg-purple-900/30'
                                    )}
                                >
                                    {/* Expand/Collapse button */}
                                    {hasChildren ? (
                                        <button
                                            type="button"
                                            onClick={(e) => toggleGroup(option.value, e)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                        >
                                            <ChevronRight
                                                className={cn(
                                                    'h-4 w-4 text-gray-400 transition-transform',
                                                    isExpanded && 'rotate-90'
                                                )}
                                            />
                                        </button>
                                    ) : (
                                        <div className="w-8" /> // Spacer when no children
                                    )}
                                    {/* Selectable category button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            'flex-1 flex items-center justify-between pr-3 py-2.5 text-left text-sm',
                                            'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                                        )}
                                    >
                                        <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                            {isExpanded || option.value === value ? (
                                                <FolderOpen className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                            ) : (
                                                <Folder className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                            )}
                                            {option.label}
                                            {hasChildren && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                                                    ({option.childCount})
                                                </span>
                                            )}
                                        </span>
                                        {option.value === value && (
                                            <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                        )}
                                    </button>
                                </div>
                            );
                        }

                        // Child option - only show if parent is expanded
                        if (option.isChild && option.parentValue && !isGroupExpanded(option.parentValue)) {
                            return null;
                        }

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    'w-full flex items-center justify-between px-3 py-2 text-left text-sm dark:text-gray-200',
                                    'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                                    option.isChild && 'pl-10',
                                    option.value === value && 'bg-gray-100 dark:bg-gray-700 font-medium'
                                )}
                            >
                                <span className="flex items-center truncate">
                                    {option.isChild && (
                                        <CornerDownRight className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
                                    )}
                                    {option.label}
                                </span>
                                {option.value === value && (
                                    <Check className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
