import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GooeyLoader } from './GooeyLoader';

export function InertiaProgress() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', () => {
            setLoading(true);
        });

        const removeFinishListener = router.on('finish', () => {
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
                    className="fixed inset-0 z-[99] flex items-center justify-center bg-white/80 backdrop-blur-[2px]"
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
                        <p className="text-sm text-gray-500 font-medium -mt-2">Loading...</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
