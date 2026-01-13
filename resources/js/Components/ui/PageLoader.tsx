import { motion } from 'framer-motion';

interface PageLoaderProps {
    message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                {/* Animated Logo/Spinner */}
                <div className="relative">
                    {/* Outer ring */}
                    <motion.div
                        className="w-16 h-16 rounded-full border-4 border-gray-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    {/* Spinning arc */}
                    <motion.div
                        className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-brand-purple"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                    {/* Inner pulsing dot */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut',
                        }}
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange" />
                    </motion.div>
                </div>

                {/* Loading text */}
                <motion.p
                    className="text-sm font-medium text-gray-600"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {message}
                </motion.p>
            </div>
        </div>
    );
}
