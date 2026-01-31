import { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { UseResizableColumnsReturn } from '@/hooks/useResizableColumns';
import { RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortIconProps {
    /** The field this icon represents */
    field: string;
    /** The currently sorted field */
    currentSortField: string;
    /** The current sort direction */
    currentSortDir: 'asc' | 'desc';
}

/**
 * A sort direction indicator icon for table column headers.
 * Shows purple color when the column is actively sorted.
 *
 * @example
 * ```tsx
 * <button onClick={() => handleSortToggle('name')}>
 *   Product
 *   <SortIcon field="name" currentSortField={sortField} currentSortDir={sortDir} />
 * </button>
 * ```
 */
export function SortIcon({ field, currentSortField, currentSortDir }: SortIconProps) {
    if (currentSortField !== field) {
        return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    return currentSortDir === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
    ) : (
        <ArrowDown className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
    );
}

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

interface StickyScrollWrapperProps {
    /** The scrollable content (typically a table) */
    children: ReactNode;
    /** Additional className for the scroll container */
    className?: string;
}

/**
 * A wrapper that provides a sticky horizontal scrollbar at the bottom of the viewport.
 * The scrollbar stays visible while scrolling vertically, making it easier to scroll
 * wide tables horizontally without having to scroll to the bottom first.
 *
 * @example
 * ```tsx
 * <StickyScrollWrapper>
 *   <table className="min-w-[1200px]">
 *     ...
 *   </table>
 * </StickyScrollWrapper>
 * ```
 */
export function StickyScrollWrapper({ children, className }: StickyScrollWrapperProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const bottomSentinelRef = useRef<HTMLDivElement>(null);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [isBottomVisible, setIsBottomVisible] = useState(false);
    const [contentWidth, setContentWidth] = useState(0);
    const [scrollbarStyle, setScrollbarStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
    const isSyncing = useRef(false);

    // Check if content overflows horizontally and update scrollbar position
    const updateOverflowState = useCallback(() => {
        if (!contentRef.current) return;

        const { scrollWidth, clientWidth } = contentRef.current;
        const overflow = scrollWidth > clientWidth;

        // Get the position and width of the content container for proper scrollbar alignment
        const rect = contentRef.current.getBoundingClientRect();

        setHasOverflow(overflow);
        setContentWidth(scrollWidth);
        setScrollbarStyle({ left: rect.left, width: rect.width });
    }, []);

    // Sync scroll positions between content and sticky scrollbar
    const handleContentScroll = useCallback(() => {
        if (isSyncing.current || !scrollbarRef.current || !contentRef.current) return;
        isSyncing.current = true;
        scrollbarRef.current.scrollLeft = contentRef.current.scrollLeft;
        requestAnimationFrame(() => { isSyncing.current = false; });
    }, []);

    const handleScrollbarScroll = useCallback(() => {
        if (isSyncing.current || !scrollbarRef.current || !contentRef.current) return;
        isSyncing.current = true;
        contentRef.current.scrollLeft = scrollbarRef.current.scrollLeft;
        requestAnimationFrame(() => { isSyncing.current = false; });
    }, []);

    // Set up observers and event listeners
    useEffect(() => {
        const content = contentRef.current;
        const bottomSentinel = bottomSentinelRef.current;
        if (!content) return;

        // Initial check
        updateOverflowState();

        // Watch for scroll and resize
        content.addEventListener('scroll', handleContentScroll);
        window.addEventListener('resize', updateOverflowState);

        // Watch for content size changes
        const resizeObserver = new ResizeObserver(updateOverflowState);
        resizeObserver.observe(content);

        // Watch for bottom visibility using IntersectionObserver
        let intersectionObserver: IntersectionObserver | null = null;
        if (bottomSentinel) {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    // When the sentinel is visible, the bottom of the table is in view
                    setIsBottomVisible(entries[0]?.isIntersecting ?? false);
                },
                { threshold: 0 }
            );
            intersectionObserver.observe(bottomSentinel);
        }

        return () => {
            content.removeEventListener('scroll', handleContentScroll);
            window.removeEventListener('resize', updateOverflowState);
            resizeObserver.disconnect();
            intersectionObserver?.disconnect();
        };
    }, [handleContentScroll, updateOverflowState]);

    // Show sticky scrollbar when there's overflow AND bottom is not visible
    const showStickyScrollbar = hasOverflow && !isBottomVisible;

    return (
        <div className="relative">
            {/* Main scrollable content - hide native scrollbar when sticky is active */}
            <div
                ref={contentRef}
                className={cn(
                    'overflow-x-auto',
                    showStickyScrollbar && 'scrollbar-hide',
                    className
                )}
            >
                {children}
            </div>

            {/* Sentinel element to detect when bottom of table is visible */}
            <div ref={bottomSentinelRef} className="h-px w-full" />

            {/* Sticky scrollbar at bottom of viewport - matches table width */}
            {showStickyScrollbar && (
                <div
                    ref={scrollbarRef}
                    onScroll={handleScrollbarScroll}
                    className="fixed bottom-0 overflow-x-auto overflow-y-hidden bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 admin-scrollbar"
                    style={{
                        height: '14px',
                        left: scrollbarStyle.left,
                        width: scrollbarStyle.width,
                    }}
                >
                    <div style={{ width: contentWidth, height: '1px' }} />
                </div>
            )}
        </div>
    );
}
