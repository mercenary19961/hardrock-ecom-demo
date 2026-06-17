import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface AdminSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    /** Outer wrapper classes — controls width e.g. "w-44" */
    className?: string;
    /** Override the trigger button's bg/border. Defaults to form-style (gray-700). */
    variant?: 'form' | 'filter';
}

export function AdminSelect({ value, onChange, options, className = '', variant = 'form' }: AdminSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label ?? '';

    const triggerCls = variant === 'filter'
        ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
        : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600';

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors ${triggerCls}`}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-max bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                    <div className="max-h-52 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
                        {options.map(opt => {
                            const active = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm transition-colors ${
                                        active
                                            ? 'bg-purple-600/25 text-purple-300'
                                            : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {active && <Check size={13} className="shrink-0 text-purple-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
