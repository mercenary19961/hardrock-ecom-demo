import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-JO', {
        style: 'currency',
        currency: 'JOD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
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

export function getImageUrl(path: string | null, productId?: number, sortOrder?: number): string {
    if (!path) {
        // Fallback to picsum.photos when no path
        const id = productId ?? 1;
        const order = sortOrder ?? 0;
        const seed = (id * 10) + order + 1;
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    if (path.startsWith('http')) return path;

    // Images in public/images folder (not storage)
    if (path.startsWith('products/')) {
        return `/images/${path}`;
    }

    return `/storage/${path}`;
}
