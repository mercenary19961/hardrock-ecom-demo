import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', error, label, id, name, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;
        const inputName = name || (label ? label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : undefined);

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    name={inputName}
                    ref={ref}
                    className={cn(
                        'flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-red-500 focus:border-red-500',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
