import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GooeyLoader } from './GooeyLoader';

// URLs that should not show the loading animation (optimistic updates)
const SILENT_URL_PATTERNS = [
    /^\/cart\/\d+$/,  // Cart item updates (PATCH /cart/123)
    /^\/cart\/add$/,  // Add to cart (POST /cart/add) - optional, remove if you want loading on add
];

// Check if a URL should be silent (no loading animation)
function isSilentRequest(url: string): boolean {
    return SILENT_URL_PATTERNS.some(pattern => pattern.test(url));
}

export function InertiaProgress() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', (event) => {
            // Don't show loading for silent/background requests (polling)
            const visit = event.detail.visit;
            if (visit.showProgress === false) {
                return;
            }
            // Don't show loading for cart operations (optimistic updates)
            if (isSilentRequest(visit.url.pathname)) {
                return;
            }
            setLoading(true);
        });

        const removeFinishListener = router.on('finish', (event) => {
            // Only hide if we were showing (handles silent requests)
            const visit = event.detail.visit;
            if (visit.showProgress === false) {
                return;
            }
            // Skip for cart operations
            if (isSilentRequest(visit.url.pathname)) {
                return;
            }
            setTimeout(() => {
                setLoading(false);
            }, 200);
        });

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    className="fixed inset-0 z-[99] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <motion.div
                        className="flex flex-col items-center gap-2"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <GooeyLoader size={120} />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium -mt-2">Loading...</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
