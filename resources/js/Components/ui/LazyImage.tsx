import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    /** Optional: Fade-in duration in ms */
    fadeDuration?: number;
}

export function LazyImage({
    src,
    alt,
    className = '',
    fadeDuration = 300,
    ...props
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        // Use Intersection Observer for lazy loading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '100px', // Start loading 100px before entering viewport
                threshold: 0.01,
            }
        );

        observer.observe(img);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Handle when image loads from cache (already complete)
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && isInView) {
            setIsLoaded(true);
        }
    }, [isInView]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* White placeholder - simple box, no borders, no text */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-white" />
            )}

            {/* Actual image */}
            <img
                ref={imgRef}
                src={isInView ? src : undefined}
                data-src={src}
                alt={alt}
                onLoad={handleLoad}
                className={`w-full h-full transition-opacity ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                    transitionDuration: `${fadeDuration}ms`,
                }}
                loading="lazy"
                decoding="async"
                {...props}
            />
        </div>
    );
}
