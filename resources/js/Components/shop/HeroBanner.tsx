import { useState, useEffect, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Slide {
    id: number;
    desktopImage: string;
    mobileImage: string;
    link: string;
    alt: string;
    altAr: string;
}

const slides: Slide[] = [
    {
        id: 1,
        desktopImage: '/images/banners/desktop/slide-1-electronics.webp',
        mobileImage: '/images/banners/mobile/slide-1-electronics.webp',
        link: '/category/electronics',
        alt: 'Latest Tech, Best Prices',
        altAr: 'أحدث التقنيات بأفضل الأسعار',
    },
    {
        id: 2,
        desktopImage: '/images/banners/desktop/slide-2-skincare.webp',
        mobileImage: '/images/banners/mobile/slide-2-skincare.webp',
        link: '/category/skincare',
        alt: 'Glow with Premium Skincare',
        altAr: 'تألقي مع العناية الفاخرة',
    },
    {
        id: 3,
        desktopImage: '/images/banners/desktop/slide-3-sale.webp',
        mobileImage: '/images/banners/mobile/slide-3-sale.webp',
        link: '/search',
        alt: 'Up to 50% Off',
        altAr: 'خصم يصل إلى 50%',
    },
    {
        id: 4,
        desktopImage: '/images/banners/desktop/slide-4-arrivals.webp',
        mobileImage: '/images/banners/mobile/slide-4-arrivals.webp',
        link: '/search?sort=newest',
        alt: 'Just Arrived',
        altAr: 'وصل حديثاً',
    },
];

// Filter to only show slides that have images available
const getAvailableSlides = () => {
    // For now, we only have slide 1
    return slides.filter(slide => slide.id === 1);
};

export function HeroBanner() {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const availableSlides = getAvailableSlides();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % availableSlides.length);
    }, [availableSlides.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + availableSlides.length) % availableSlides.length);
    }, [availableSlides.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 5 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 5000);
    };

    // Auto-advance slides
    useEffect(() => {
        if (!isAutoPlaying || availableSlides.length <= 1) return;

        const interval = setInterval(goToNext, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext, availableSlides.length]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                isArabic ? goToNext() : goToPrev();
            } else if (e.key === 'ArrowRight') {
                isArabic ? goToPrev() : goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev, isArabic]);

    const currentSlide = availableSlides[currentIndex];

    return (
        <section className="relative w-full overflow-hidden bg-gray-100">
            {/* Slides Container */}
            <div className="relative">
                <Link href={currentSlide.link} className="block">
                    {/* Desktop Image */}
                    <picture>
                        <source
                            media="(min-width: 768px)"
                            srcSet={currentSlide.desktopImage}
                        />
                        {/* Mobile Image */}
                        <img
                            src={currentSlide.mobileImage}
                            alt={isArabic ? currentSlide.altAr : currentSlide.alt}
                            className="w-full h-auto object-cover"
                            style={{ aspectRatio: '768/500' }}
                        />
                    </picture>
                    {/* Desktop aspect ratio override */}
                    <style>{`
                        @media (min-width: 768px) {
                            section.relative img {
                                aspect-ratio: 1920/600 !important;
                            }
                        }
                    `}</style>
                </Link>
            </div>

            {/* Navigation Arrows - Only show if more than 1 slide */}
            {availableSlides.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            isArabic ? goToNext() : goToPrev();
                            setIsAutoPlaying(false);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            isArabic ? goToPrev() : goToNext();
                            setIsAutoPlaying(false);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                    </button>
                </>
            )}

            {/* Dots Navigation - Only show if more than 1 slide */}
            {availableSlides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                    {availableSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                                index === currentIndex
                                    ? 'bg-gray-900'
                                    : 'bg-white/70 hover:bg-white'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
