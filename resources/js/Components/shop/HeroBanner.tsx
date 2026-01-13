import { useState, useEffect, useCallback } from "react";
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
        desktopImage: "/images/banners/desktop/slide-1-electronics-2.webp",
        mobileImage: "/images/banners/mobile/slide-1-electronics.webp",
        link: "/category/electronics",
        alt: "Latest Tech, Best Prices",
        altAr: "أحدث التقنيات بأفضل الأسعار",
    },
    {
        id: 2,
        desktopImage: "/images/banners/desktop/slide-2-skincare-2.webp",
        mobileImage: "/images/banners/mobile/slide-2-skincare.webp",
        link: "/category/skincare",
        alt: "Premium Skincare Products",
        altAr: "منتجات العناية بالبشرة الفاخرة",
    },
    {
        id: 3,
        desktopImage: "/images/banners/desktop/slide-3-kids-2.webp",
        mobileImage: "/images/banners/mobile/slide-3-kids.webp",
        link: "/category/building-blocks",
        alt: "Building Blocks & Kids Toys",
        altAr: "ألعاب البناء والألعاب التعليمية",
    },
    {
        id: 4,
        desktopImage: "/images/banners/desktop/slide-4-fashion-2.webp",
        mobileImage: "/images/banners/mobile/slide-4-fashion.webp",
        link: "/category/fashion?has_discount=1&sort=sale",
        alt: "Trendy Fashion & Accessories",
        altAr: "الموضة والإكسسوارات العصرية",
    },
];

// Get all available slides
const getAvailableSlides = () => {
    return slides;
};

export function HeroBanner() {
    const { language } = useLanguage();
    const isArabic = language === "ar";
    const availableSlides = getAvailableSlides();

    const [currentIndex, setCurrentIndex] = useState(2); // Start at third slide (kids toys)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % availableSlides.length);
    }, [availableSlides.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex(
            (prev) =>
                (prev - 1 + availableSlides.length) % availableSlides.length
        );
    }, [availableSlides.length]);

    // Auto-advance slides
    useEffect(() => {
        if (!isAutoPlaying || availableSlides.length <= 1) return;

        const interval = setInterval(goToNext, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext, availableSlides.length]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                isArabic ? goToNext() : goToPrev();
            } else if (e.key === "ArrowRight") {
                isArabic ? goToPrev() : goToNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
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
                            alt={
                                isArabic ? currentSlide.altAr : currentSlide.alt
                            }
                            className="w-full h-auto object-cover"
                            style={{ aspectRatio: "768/500" }}
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                        />
                    </picture>
                    {/* Desktop aspect ratio override */}
                    <style>{`
                        @media (min-width: 768px) {
                            section.relative img {
                                aspect-ratio: 1920/246 !important;
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

        </section>
    );
}
