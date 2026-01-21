import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
        success: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
        danger: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
