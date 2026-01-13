import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number, language: string = 'en'): string {
    const isArabic = language === 'ar';
    // Hide decimals for amounts >= 1000, otherwise show only if price has fractions
    const hideDecimals = price >= 1000;
    const hasDecimals = price % 1 !== 0;
    const formatted = new Intl.NumberFormat(isArabic ? 'ar-JO' : 'en-JO', {
        minimumFractionDigits: hideDecimals ? 0 : (hasDecimals ? 2 : 0),
        maximumFractionDigits: hideDecimals ? 0 : 2,
    }).format(price);

    // Add currency label based on language
    return isArabic ? `${formatted} دينار` : `JOD ${formatted}`;
}

export function formatNumber(value: number, language: string = 'en'): string {
    const isArabic = language === 'ar';
    return new Intl.NumberFormat(isArabic ? 'ar-JO' : 'en-JO', {
        useGrouping: false,
    }).format(value);
}

export function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

export function formatDateTime(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function getDiscountPercentage(price: number, comparePrice: number): number {
    return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Cloudflare Image Resizing options
 */
interface ImageResizeOptions {
    width?: number;
    height?: number;
    quality?: number;
    fit?: 'contain' | 'cover' | 'scale-down' | 'crop';
}

/**
 * Get image URL with optional Cloudflare Image Resizing (Pro plan feature)
 * https://developers.cloudflare.com/images/image-resizing/url-format/
 */
export function getImageUrl(
    path: string | null,
    productId?: number,
    sortOrder?: number,
    options?: ImageResizeOptions
): string {
    if (!path) {
        // Fallback to picsum.photos when no path
        const id = productId ?? 1;
        const order = sortOrder ?? 0;
        const seed = (id * 10) + order + 1;
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    if (path.startsWith('http')) return path;

    // Build the base URL
    let baseUrl: string;
    if (path.startsWith('products/')) {
        baseUrl = `/images/${path}`;
    } else {
        baseUrl = `/storage/${path}`;
    }

    // If resize options provided, use Cloudflare Image Resizing
    if (options && (options.width || options.height)) {
        const params: string[] = [];
        if (options.width) params.push(`width=${options.width}`);
        if (options.height) params.push(`height=${options.height}`);
        params.push(`quality=${options.quality || 80}`);
        params.push(`fit=${options.fit || 'contain'}`);
        params.push('format=webp'); // Always use WebP for best compression

        return `/cdn-cgi/image/${params.join(',')}${baseUrl}`;
    }

    return baseUrl;
}

/**
 * Get optimized image URL for product cards
 * Uses Cloudflare Image Resizing to serve 400px images instead of full-size
 */
export function getOptimizedProductImage(path: string | null, productId?: number, sortOrder?: number): string {
    return getImageUrl(path, productId, sortOrder, {
        width: 400,
        quality: 80,
        fit: 'contain',
    });
}
