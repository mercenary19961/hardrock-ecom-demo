"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, defaultValue, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number[]>(
        (defaultValue as number[]) ?? (value as number[]) ?? [0],
    );

    React.useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value as number[]);
        }
    }, [value]);

    const handleValueChange = (newValue: number[]) => {
        setInternalValue(newValue);
        props.onValueChange?.(newValue);
    };

    return (
        <SliderPrimitive.Root
            ref={ref}
            className={cn(
                "relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[disabled]:opacity-50",
                className,
            )}
            defaultValue={defaultValue}
            value={value}
            onValueChange={handleValueChange}
            {...props}
        >
            <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-gray-200 data-[orientation=horizontal]:h-2 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-2">
                <SliderPrimitive.Range className="absolute bg-gray-900 data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
            </SliderPrimitive.Track>
            {internalValue?.map((_, index) => (
                <SliderPrimitive.Thumb
                    key={index}
                    className="block h-5 w-5 rounded-full border-2 border-gray-900 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
            ))}
        </SliderPrimitive.Root>
    );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
