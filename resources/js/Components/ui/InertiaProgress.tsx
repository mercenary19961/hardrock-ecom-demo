import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GooeyLoader } from './GooeyLoader';

export function InertiaProgress() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const removeStartListener = router.on('start', () => {
            setLoading(true);
            setProgress(0);
        });

        const removeProgressListener = router.on('progress', (event) => {
            const progressEvent = event.detail.progress;
            if (progressEvent && 'percentage' in progressEvent) {
                setProgress((progressEvent as { percentage: number }).percentage);
            }
        });

        const removeFinishListener = router.on('finish', () => {
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 200);
        });

        return () => {
            removeStartListener();
            removeProgressListener();
            removeFinishListener();
        };
    }, []);

    return (
        <AnimatePresence>
            {loading && (
                <>
                    {/* Top progress bar */}
                    <motion.div
                        className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-brand-purple to-brand-orange"
                            initial={{ width: '0%' }}
                            animate={{ width: progress > 0 ? `${progress}%` : '30%' }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                    </motion.div>

                    {/* Full page overlay with gooey loader */}
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
                </>
            )}
        </AnimatePresence>
    );
}
