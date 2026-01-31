import { useState, useEffect, useCallback, useRef } from 'react';

export interface ColumnDefinition {
    /** Unique identifier for the column */
    key: string;
    /** Minimum width in pixels (default: 80) */
    minWidth?: number;
    /** Maximum width in pixels (default: unlimited) */
    maxWidth?: number;
    /** Default/initial width in pixels */
    defaultWidth: number;
}

export interface UseResizableColumnsOptions {
    /** Unique key for localStorage persistence */
    storageKey: string;
    /** Column definitions with default widths and constraints */
    columns: ColumnDefinition[];
    /** Whether resizing is enabled (default: true). Set to false on mobile. */
    enabled?: boolean;
}

export interface UseResizableColumnsReturn {
    /** Current width for each column by key */
    columnWidths: Record<string, number>;
    /** Whether a resize is currently in progress */
    isResizing: boolean;
    /** The key of the column currently being resized */
    resizingColumn: string | null;
    /** Start resizing a column. Call this on mousedown of resize handle. */
    startResize: (columnKey: string, startX: number) => void;
    /** Reset all columns to their default widths */
    resetWidths: () => void;
    /** Get props to spread on the resize handle element */
    getResizeHandleProps: (columnKey: string) => {
        onMouseDown: (e: React.MouseEvent) => void;
        onDoubleClick: () => void;
        style: React.CSSProperties;
        className: string;
    };
}

/**
 * Hook to enable drag-to-resize columns in a table.
 * Persists column widths to localStorage and handles all resize logic.
 *
 * @example
 * ```tsx
 * const { columnWidths, getResizeHandleProps, resetWidths } = useResizableColumns({
 *     storageKey: 'reviews-table',
 *     columns: [
 *         { key: 'product', defaultWidth: 180, minWidth: 100 },
 *         { key: 'customer', defaultWidth: 150, minWidth: 100 },
 *     ],
 * });
 *
 * // In your table header:
 * <th style={{ width: columnWidths.product }}>
 *     Product
 *     <div {...getResizeHandleProps('product')} />
 * </th>
 * ```
 */
export function useResizableColumns(options: UseResizableColumnsOptions): UseResizableColumnsReturn {
    const { storageKey, columns, enabled = true } = options;

    // Build default widths from column definitions
    const defaultWidths = columns.reduce((acc, col) => {
        acc[col.key] = col.defaultWidth;
        return acc;
    }, {} as Record<string, number>);

    // Build constraints map
    const constraints = columns.reduce((acc, col) => {
        acc[col.key] = {
            min: col.minWidth ?? 80,
            max: col.maxWidth ?? Infinity,
        };
        return acc;
    }, {} as Record<string, { min: number; max: number }>);

    // Initialize state from localStorage or defaults
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        if (typeof window === 'undefined') return defaultWidths;

        try {
            const stored = localStorage.getItem(`table-columns-${storageKey}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new columns
                return { ...defaultWidths, ...parsed };
            }
        } catch {
            // Ignore localStorage errors
        }
        return defaultWidths;
    });

    const [isResizing, setIsResizing] = useState(false);
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);

    // Refs to track resize state without causing re-renders
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const currentColumnRef = useRef<string | null>(null);

    // Save to localStorage when widths change
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(`table-columns-${storageKey}`, JSON.stringify(columnWidths));
        } catch {
            // Ignore localStorage errors
        }
    }, [columnWidths, storageKey]);

    // Handle mouse move during resize
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!currentColumnRef.current) return;

        const columnKey = currentColumnRef.current;
        const constraint = constraints[columnKey];
        const delta = e.clientX - startXRef.current;
        let newWidth = startWidthRef.current + delta;

        // Apply constraints
        newWidth = Math.max(constraint.min, newWidth);
        if (constraint.max !== Infinity) {
            newWidth = Math.min(constraint.max, newWidth);
        }

        setColumnWidths(prev => ({
            ...prev,
            [columnKey]: newWidth,
        }));
    }, [constraints]);

    // Handle mouse up to end resize
    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        setResizingColumn(null);
        currentColumnRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Attach/detach document listeners
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Start resizing a column
    const startResize = useCallback((columnKey: string, startX: number) => {
        if (!enabled) return;

        currentColumnRef.current = columnKey;
        startXRef.current = startX;
        startWidthRef.current = columnWidths[columnKey] || defaultWidths[columnKey];

        setIsResizing(true);
        setResizingColumn(columnKey);

        // Prevent text selection during drag
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [enabled, columnWidths, defaultWidths]);

    // Reset all columns to default widths
    const resetWidths = useCallback(() => {
        setColumnWidths(defaultWidths);
        try {
            localStorage.removeItem(`table-columns-${storageKey}`);
        } catch {
            // Ignore localStorage errors
        }
    }, [defaultWidths, storageKey]);

    // Auto-fit column to content (on double-click)
    const autoFitColumn = useCallback((columnKey: string) => {
        // Reset to default width on double-click
        setColumnWidths(prev => ({
            ...prev,
            [columnKey]: defaultWidths[columnKey],
        }));
    }, [defaultWidths]);

    // Get props for resize handle element
    const getResizeHandleProps = useCallback((columnKey: string) => ({
        onMouseDown: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            startResize(columnKey, e.clientX);
        },
        onDoubleClick: () => autoFitColumn(columnKey),
        style: {
            position: 'absolute' as const,
            right: 0,
            top: 0,
            bottom: 0,
            width: '12px',
            cursor: 'col-resize',
            zIndex: 10,
        },
        className: 'resize-handle',
    }), [startResize, autoFitColumn]);

    return {
        columnWidths,
        isResizing,
        resizingColumn,
        startResize,
        resetWidths,
        getResizeHandleProps,
    };
}
