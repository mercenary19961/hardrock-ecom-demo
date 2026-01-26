import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    History,
    Clock,
    AlertTriangle,
    Info,
    ArrowRight,
    Type,
    FileText,
    ToggleLeft,
    Image,
    List,
    FolderTree,
    Database,
    Tag,
    DollarSign,
    Package,
    Hash,
    Star,
    Power,
    Palette,
    Ruler,
    Layers,
    Globe,
    Languages,
    LucideIcon,
} from 'lucide-react';
import { Button } from './Button';

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
    changes?: FieldChange[];
}

interface UndoButtonProps {
    modelType: string;
    modelId: number;
    undoMeta: UndoMeta | null;
    className?: string;
}

export function UndoButton({ modelType, modelId, undoMeta, className = '' }: UndoButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!undoMeta?.available) {
        return null;
    }

    const changes = undoMeta.changes || [];

    const formatTimeAgo = (isoDate: string): string => {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const handleUndo = () => {
        setProcessing(true);
        router.post(
            `/admin/undo/${modelType}/${modelId}`,
            {},
            {
                preserveScroll: false,
                preserveState: false,  // Force fresh state after redirect
                onFinish: () => {
                    setProcessing(false);
                    setShowConfirm(false);
                },
            }
        );
    };

    // Get icon/badge for change type
    const getChangeTypeBadge = (type: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            'boolean': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Toggle' },
            'array': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'List' },
            'json': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Data' },
            'select': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', label: 'Select' },
        };
        return badges[type];
    };

    // Get icon for field based on field name
    const getFieldIcon = (field: string, type: string): LucideIcon => {
        const fieldIcons: Record<string, LucideIcon> = {
            // Product fields
            'name': Type,
            'name_ar': Languages,
            'slug': Tag,
            'description': FileText,
            'description_ar': FileText,
            'short_description': FileText,
            'short_description_ar': FileText,
            'price': DollarSign,
            'compare_price': DollarSign,
            'sku': Hash,
            'stock': Package,
            'low_stock_threshold': Package,
            'category_id': FolderTree,
            'is_active': Power,
            'is_featured': Star,
            'available_sizes': Ruler,
            'available_colors': Palette,
            'variant_stock': Layers,
            'image': Image,
            // Category fields
            'parent_id': FolderTree,
            'sort_order': List,
            // Order fields
            'status': Power,
            'shipping_address': Globe,
            'notes': FileText,
        };

        // Return specific field icon or fallback based on type
        if (fieldIcons[field]) {
            return fieldIcons[field];
        }

        // Fallback by type
        const typeIcons: Record<string, LucideIcon> = {
            'text': Type,
            'textarea': FileText,
            'boolean': ToggleLeft,
            'image': Image,
            'select': List,
            'array': Layers,
            'json': Database,
        };

        return typeIcons[type] || Type;
    };

    // Render a single change item
    const renderChangeItem = (change: FieldChange, index: number) => {
        const badge = getChangeTypeBadge(change.type);
        const FieldIcon = getFieldIcon(change.field, change.type);

        return (
            <div key={index} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-gray-100 dark:bg-gray-700">
                            <FieldIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                            {change.label}
                        </span>
                    </div>
                    {badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-xs ml-6">
                    <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through max-w-[130px] truncate" title={change.old}>
                        {change.old}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 max-w-[130px] truncate" title={change.new}>
                        {change.new}
                    </span>
                </div>
            </div>
        );
    };

    if (showConfirm) {
        return (
            <div className={`flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg ${className}`}>
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Restore previous version?</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        This will revert {changes.length} field{changes.length !== 1 ? 's' : ''} to their previous values.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfirm(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleUndo}
                        disabled={processing}
                        className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                    >
                        {processing ? 'Restoring...' : 'Restore'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                type="button"
                onClick={() => setShowConfirm(true)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
                <History className="h-4 w-4" />
                <span>Undo Last Update</span>
                {changes.length > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs text-blue-600 dark:text-blue-300">
                        <Info className="h-3 w-3" />
                        {changes.length} change{changes.length !== 1 ? 's' : ''}
                    </span>
                )}
                <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(undoMeta.saved_at)}
                </span>
            </button>

            {/* Tooltip showing changes */}
            {showTooltip && changes.length > 0 && (
                <div className="absolute top-full left-0 mt-2 z-50 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                Changes made in last update
                            </span>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-xs font-medium text-purple-600 dark:text-purple-300">
                            {changes.length} field{changes.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Changes list - uses admin-scrollbar styles from global CSS */}
                    <div className="space-y-0 max-h-60 overflow-y-auto pr-2">
                        {changes.map((change, index) => renderChangeItem(change, index))}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Click to restore previous values
                        </span>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                            <History className="h-3 w-3" />
                            Restore
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
