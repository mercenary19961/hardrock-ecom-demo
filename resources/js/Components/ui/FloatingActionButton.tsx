import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

interface FloatingActionButtonProps {
    href: string;
    ariaLabel: string;
    backgroundColor: string;
    icon: React.ReactNode;
    iconClassName?: string;
    label?: string;
}

export function FloatingActionButton({
    href,
    ariaLabel,
    backgroundColor,
    icon,
    iconClassName = "w-6 h-6 md:w-7 md:h-7 text-white",
    label,
}: FloatingActionButtonProps) {
    const buttonControls = useAnimationControls();
    const labelControls = useAnimationControls();

    useEffect(() => {
        const runAnimationLoop = async () => {
            // Initial delay of 5 seconds before starting
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Infinite animation loop
            while (true) {
                // Slide in button from right (0.5s, easeOut)
                await buttonControls.start({
                    x: 0,
                    opacity: 1,
                    transition: { duration: 0.5, ease: "easeOut" },
                });

                // Delay before showing label (1 second after button appears)
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Animate label in (fade and scale)
                if (label) {
                    await labelControls.start({
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: "easeOut" },
                    });

                    // Keep label visible for 4 seconds
                    await new Promise((resolve) => setTimeout(resolve, 4000));

                    // Animate label out (fade and scale down)
                    await labelControls.start({
                        opacity: 0,
                        scale: 0.8,
                        y: -10,
                        transition: { duration: 0.3, ease: "easeIn" },
                    });
                }

                // Keep button visible for 1 more second after label disappears
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Slide out button to right (3s, easeIn)
                await buttonControls.start({
                    x: 100,
                    opacity: 0,
                    transition: { duration: 3, ease: "easeIn" },
                });

                // Stay hidden for 3 seconds
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        };

        runAnimationLoop();
    }, [buttonControls, labelControls, label]);

    // Determine if backgroundColor is a Tailwind class or hex color
    const bgStyle = backgroundColor.startsWith("bg-")
        ? {}
        : { backgroundColor };
    const bgClass = backgroundColor.startsWith("bg-") ? backgroundColor : "";

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={buttonControls}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-center"
        >
            {/* Label tooltip with motion */}
            {label && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={labelControls}
                    className="mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap relative"
                >
                    {label}
                    {/* Arrow pointing down */}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45" />
                </motion.div>
            )}
            {/* Button */}
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabel}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center ${bgClass}`}
                style={bgStyle}
            >
                <span className={iconClassName}>{icon}</span>
            </motion.a>
        </motion.div>
    );
}
