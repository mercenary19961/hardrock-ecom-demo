import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    priority?: boolean; // If true, load immediately (for above-the-fold images)
}

export function LazyImage({
    src,
    alt,
    className = '',
    placeholderClassName = '',
    priority = false,
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (priority) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px', // Start loading 200px before entering viewport
                threshold: 0,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    return (
        <div ref={imgRef} className="relative w-full h-full">
            {/* Placeholder skeleton */}
            {!isLoaded && (
                <div
                    className={`absolute inset-0 bg-gray-100 animate-pulse ${placeholderClassName}`}
                />
            )}

            {/* Actual image - only rendered when in view */}
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setIsLoaded(true)}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                />
            )}
        </div>
    );
}
