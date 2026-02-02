import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/Components/ui';

interface ExportFormat {
    value: string;
    label: string;
    icon: React.ElementType;
    extension: string;
}

const exportFormats: ExportFormat[] = [
    { value: 'csv', label: 'CSV', icon: FileText, extension: '.csv' },
    { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, extension: '.xls' },
    { value: 'json', label: 'JSON', icon: FileJson, extension: '.json' },
];

interface ExportDropdownProps {
    baseUrl: string;
    filters?: Record<string, string | number | undefined>;
    selectedIds?: number[];
    disabled?: boolean;
    className?: string;
}

export function ExportDropdown({
    baseUrl,
    filters = {},
    selectedIds = [],
    disabled = false,
    className = '',
}: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleExport = (format: string) => {
        const params = new URLSearchParams();

        // Add format
        params.append('format', format);

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                params.append(key, String(value));
            }
        });

        // Add selected IDs if any
        if (selectedIds.length > 0) {
            selectedIds.forEach((id) => params.append('product_ids[]', id.toString()));
        }

        // Trigger download
        window.location.href = `${baseUrl}?${params.toString()}`;
        setIsOpen(false);
    };

    const selectedCount = selectedIds.length;

    return (
        <div ref={dropdownRef} className={`relative inline-block ${className}`}>
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2"
            >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                    Export{selectedCount > 0 ? ` (${selectedCount})` : ''}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Export as
                        </p>
                    </div>
                    {exportFormats.map((format) => {
                        const Icon = format.icon;
                        return (
                            <button
                                key={format.value}
                                onClick={() => handleExport(format.value)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="flex-1">{format.label}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {format.extension}
                                </span>
                            </button>
                        );
                    })}
                    {selectedCount > 0 && (
                        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
