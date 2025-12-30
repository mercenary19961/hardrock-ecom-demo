import { useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface UsePollingOptions {
    /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
    interval?: number;
    /** Whether polling is enabled (default: true) */
    enabled?: boolean;
    /** Only poll when the tab is visible (default: true) */
    onlyWhenVisible?: boolean;
}

/**
 * Hook to automatically refresh page data at a specified interval.
 * Uses Inertia's router.reload() to fetch fresh data without full page reload.
 *
 * @param options - Polling configuration options
 * @returns Object with manual refresh function
 */
export function usePolling(options: UsePollingOptions = {}) {
    const {
        interval = 30000, // 30 seconds default
        enabled = true,
        onlyWhenVisible = true,
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isVisibleRef = useRef(true);

    const refresh = useCallback(() => {
        if (onlyWhenVisible && !isVisibleRef.current) {
            return;
        }

        router.reload({
            only: [], // Empty array reloads all props
        });
    }, [onlyWhenVisible]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Handle visibility change
        const handleVisibilityChange = () => {
            isVisibleRef.current = document.visibilityState === 'visible';

            // Refresh immediately when tab becomes visible again
            if (isVisibleRef.current && onlyWhenVisible) {
                refresh();
            }
        };

        if (onlyWhenVisible) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        // Start polling
        intervalRef.current = setInterval(refresh, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (onlyWhenVisible) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [enabled, interval, onlyWhenVisible, refresh]);

    return { refresh };
}
