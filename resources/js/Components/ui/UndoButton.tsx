import { useState } from 'react';
import { router } from '@inertiajs/react';
import { History, Clock, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface FieldChange {
    field: string;
    label: string;
    type: 'text' | 'textarea' | 'boolean' | 'image' | 'select';
    old: string;
    new: string;
    old_path?: string;
    new_path?: string;
    old_id?: string | number;
    new_id?: string | number;
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

    // Render a single change item
    const renderChangeItem = (change: FieldChange, index: number) => {
        return (
            <div key={index} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-gray-700 min-w-[100px] flex-shrink-0">
                    {change.label}:
                </span>
                <span className="flex items-center gap-1 text-gray-600 flex-wrap">
                    <span className="text-red-600 line-through">{change.old}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-green-600">{change.new}</span>
                </span>
            </div>
        );
    };

    if (showConfirm) {
        return (
            <div className={`flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Restore previous version?</p>
                    <p className="text-xs text-amber-600">
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
                        className="bg-amber-600 hover:bg-amber-700"
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
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
                <History className="h-4 w-4" />
                <span>Undo Last Update</span>
                {changes.length > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded text-xs text-blue-600">
                        <Info className="h-3 w-3" />
                        {changes.length} change{changes.length !== 1 ? 's' : ''}
                    </span>
                )}
                <span className="flex items-center gap-1 text-xs text-blue-500">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(undoMeta.saved_at)}
                </span>
            </button>

            {/* Tooltip showing changes */}
            {showTooltip && changes.length > 0 && (
                <div className="absolute top-full left-0 mt-2 z-50 w-80 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-800">
                            Changes made in last update:
                        </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {changes.map((change, index) => renderChangeItem(change, index))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        Click to restore previous values
                    </div>
                </div>
            )}
        </div>
    );
}
