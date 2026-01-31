import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { UseResizableColumnsReturn } from '@/hooks/useResizableColumns';
import { RotateCcw } from 'lucide-react';

interface ResizableThProps {
    /** Column key matching the useResizableColumns configuration */
    columnKey: string;
    /** The resizable columns hook return value */
    resizable: UseResizableColumnsReturn;
    /** Content to render in the header cell */
    children: ReactNode;
    /** Additional className for the th element */
    className?: string;
    /** Whether this column should be resizable (default: true) */
    isResizable?: boolean;
}

/**
 * A table header cell (th) with drag-to-resize functionality.
 *
 * @example
 * ```tsx
 * const resizable = useResizableColumns({ ... });
 *
 * <thead>
 *   <tr>
 *     <ResizableTh columnKey="product" resizable={resizable}>
 *       Product
 *     </ResizableTh>
 *     <ResizableTh columnKey="customer" resizable={resizable}>
 *       Customer
 *     </ResizableTh>
 *   </tr>
 * </thead>
 * ```
 */
export function ResizableTh({
    columnKey,
    resizable,
    children,
    className,
    isResizable = true,
}: ResizableThProps) {
    const { columnWidths, getResizeHandleProps, isResizing, resizingColumn } = resizable;
    const width = columnWidths[columnKey];
    const isCurrentlyResizing = isResizing && resizingColumn === columnKey;

    return (
        <th
            className={cn(
                'relative group',
                className,
                isCurrentlyResizing && 'bg-purple-50 dark:bg-purple-900/20'
            )}
            style={{ width: width ? `${width}px` : undefined }}
        >
            {children}
            {isResizable && (
                <div
                    {...getResizeHandleProps(columnKey)}
                    title="Drag to resize, double-click to reset"
                >
                    {/* Visible separator line */}
                    <div
                        className={cn(
                            'absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px',
                            'bg-gray-300 dark:bg-gray-600',
                            'group-hover:w-0.5 group-hover:bg-purple-500 dark:group-hover:bg-purple-400',
                            'transition-all duration-150',
                            isCurrentlyResizing && 'w-0.5 bg-purple-500 dark:bg-purple-400'
                        )}
                    />
                </div>
            )}
        </th>
    );
}

interface ResetColumnsButtonProps {
    /** The resizable columns hook return value */
    resizable: UseResizableColumnsReturn;
    /** Additional className */
    className?: string;
}

/**
 * A button to reset all column widths to their defaults.
 */
export function ResetColumnsButton({ resizable, className }: ResetColumnsButtonProps) {
    return (
        <button
            type="button"
            onClick={resizable.resetWidths}
            className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400',
                'hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
                'rounded transition-colors',
                className
            )}
            title="Reset column widths to default"
        >
            <RotateCcw className="h-3 w-3" />
            Reset columns
        </button>
    );
}

interface ResizableTableProps {
    children: ReactNode;
    className?: string;
}

/**
 * A table wrapper that enables the table-fixed layout required for resizable columns.
 */
export function ResizableTable({ children, className }: ResizableTableProps) {
    return (
        <table className={cn('w-full table-fixed', className)}>
            {children}
        </table>
    );
}
