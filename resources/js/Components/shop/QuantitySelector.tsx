import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/utils";

interface QuantitySelectorProps {
    quantity: number;
    onChange: (quantity: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
}

export function QuantitySelector({
    quantity,
    onChange,
    min = 1,
    max = 99,
    disabled = false,
}: QuantitySelectorProps) {
    const { i18n } = useTranslation();
    const language = i18n.language;

    const decrease = () => {
        if (quantity > min) {
            onChange(quantity - 1);
        }
    };

    const increase = () => {
        if (quantity < max) {
            onChange(quantity + 1);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={decrease}
                disabled={disabled || quantity <= min}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-medium">
                {formatNumber(quantity, language)}
            </span>
            <button
                type="button"
                onClick={increase}
                disabled={disabled || quantity >= max}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}
