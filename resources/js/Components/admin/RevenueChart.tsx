import { lazy, Suspense, useMemo, useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

// Lazy load recharts components for code splitting
const ComposedChart = lazy(() => import('recharts').then(m => ({ default: m.ComposedChart })));
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })));
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const Legend = lazy(() => import('recharts').then(m => ({ default: m.Legend })));

// Hook to detect dark mode
function useDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Watch for class changes on html element
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return isDark;
}

export interface ChartDataPoint {
    date: string;
    orders: number;
    revenue: number;
}

interface RevenueChartProps {
    data: ChartDataPoint[];
}

function ChartLoadingFallback() {
    return (
        <div className="h-[300px] bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">Loading chart...</span>
        </div>
    );
}

export function RevenueChart({ data }: RevenueChartProps) {
    const isDark = useDarkMode();

    // Format date for display
    const formattedData = useMemo(() => {
        return data.map(d => ({
            ...d,
            displayDate: new Date(d.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
        }));
    }, [data]);

    // Calculate totals for header
    const totals = useMemo(() => {
        return data.reduce(
            (acc, d) => ({
                orders: acc.orders + d.orders,
                revenue: acc.revenue + d.revenue,
            }),
            { orders: 0, revenue: 0 }
        );
    }, [data]);

    // Chart colors based on theme
    const colors = {
        grid: isDark ? '#374151' : '#f0f0f0',
        axis: isDark ? '#4b5563' : '#e5e7eb',
        text: isDark ? '#9ca3af' : '#6b7280',
        tooltipBg: isDark ? '#1f2937' : 'white',
        tooltipBorder: isDark ? '#374151' : '#e5e7eb',
        tooltipText: isDark ? '#f3f4f6' : '#111827',
        legendText: isDark ? '#d1d5db' : '#374151',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand-purple" />
                    Revenue & Orders
                </h2>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-brand-purple" />
                        <span className="text-gray-600 dark:text-gray-400">Orders: {totals.orders}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-brand-orange" />
                        <span className="text-gray-600 dark:text-gray-400">Revenue: {totals.revenue.toFixed(2)} JOD</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px]">
                <Suspense fallback={<ChartLoadingFallback />}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 12, fill: colors.text }}
                                tickLine={false}
                                axisLine={{ stroke: colors.axis }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 12, fill: colors.text }}
                                tickLine={false}
                                axisLine={{ stroke: colors.axis }}
                                label={{
                                    value: 'Orders',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fontSize: 12, fill: colors.text },
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 12, fill: colors.text }}
                                tickLine={false}
                                axisLine={{ stroke: colors.axis }}
                                label={{
                                    value: 'Revenue (JOD)',
                                    angle: 90,
                                    position: 'insideRight',
                                    style: { fontSize: 12, fill: colors.text },
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: colors.tooltipBg,
                                    border: `1px solid ${colors.tooltipBorder}`,
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    color: colors.tooltipText,
                                }}
                                formatter={(value, name) => [
                                    name === 'revenue' ? `${Number(value).toFixed(2)} JOD` : value,
                                    name === 'revenue' ? 'Revenue' : 'Orders',
                                ]}
                                labelStyle={{ color: colors.tooltipText }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value) => (
                                    <span style={{ color: colors.legendText }}>
                                        {value === 'revenue' ? 'Revenue' : 'Orders'}
                                    </span>
                                )}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="orders"
                                fill="#7c3aed"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ fill: '#f97316', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#f97316' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Suspense>
            </div>
        </div>
    );
}
