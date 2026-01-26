import { InputHTMLAttributes, forwardRef, useId, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    error?: string;
    label?: string;
    showSpinners?: boolean;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, error, label, id, name, showSpinners = true, min, max, step = 1, value, onChange, disabled, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;
        const inputName = name || (label ? label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : undefined);
        const internalRef = useRef<HTMLInputElement>(null);
        const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

        const handleIncrement = useCallback(() => {
            const input = inputRef.current;
            if (!input || disabled) return;

            const currentValue = parseFloat(input.value) || 0;
            const stepValue = typeof step === 'number' ? step : parseFloat(step) || 1;
            const maxValue = max !== undefined ? (typeof max === 'number' ? max : parseFloat(max)) : Infinity;
            const newValue = Math.min(currentValue + stepValue, maxValue);

            // Trigger a native change event
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(input, newValue.toString());
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        }, [inputRef, step, max, disabled]);

        const handleDecrement = useCallback(() => {
            const input = inputRef.current;
            if (!input || disabled) return;

            const currentValue = parseFloat(input.value) || 0;
            const stepValue = typeof step === 'number' ? step : parseFloat(step) || 1;
            const minValue = min !== undefined ? (typeof min === 'number' ? min : parseFloat(min)) : -Infinity;
            const newValue = Math.max(currentValue - stepValue, minValue);

            // Trigger a native change event
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(input, newValue.toString());
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        }, [inputRef, step, min, disabled]);

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
                <div className={cn("admin-number-spinner w-full", !showSpinners && "admin-number-spinner-hidden")}>
                    <input
                        type="number"
                        id={inputId}
                        name={inputName}
                        ref={inputRef}
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className={cn(
                            'flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50',
                            error && 'border-red-500 focus:border-red-500',
                            showSpinners && 'pr-10',
                            className
                        )}
                        {...props}
                    />
                    {showSpinners && (
                        <div className="admin-spinner-buttons">
                            <button
                                type="button"
                                className="admin-spinner-btn"
                                onClick={handleIncrement}
                                disabled={disabled}
                                tabIndex={-1}
                                aria-label="Increment"
                            >
                                <ChevronUp />
                            </button>
                            <button
                                type="button"
                                className="admin-spinner-btn"
                                onClick={handleDecrement}
                                disabled={disabled}
                                tabIndex={-1}
                                aria-label="Decrement"
                            >
                                <ChevronDown />
                            </button>
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
