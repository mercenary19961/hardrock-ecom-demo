import { Calendar, CalendarDays, CalendarRange, Infinity } from 'lucide-react';

export type DateRange = 'today' | 'week' | 'month' | 'all';

interface DateRangeSelectorProps {
    selected: DateRange;
    onChange: (range: DateRange) => void;
}

const ranges: { id: DateRange; label: string; icon: typeof Calendar }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'week', label: 'This Week', icon: CalendarDays },
    { id: 'month', label: 'This Month', icon: CalendarRange },
    { id: 'all', label: 'All Time', icon: Infinity },
];

export function DateRangeSelector({ selected, onChange }: DateRangeSelectorProps) {
    return (
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {ranges.map((range) => {
                const Icon = range.icon;
                const isSelected = selected === range.id;

                return (
                    <button
                        key={range.id}
                        onClick={() => onChange(range.id)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                            ${isSelected
                                ? 'bg-brand-purple text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }
                        `}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{range.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
