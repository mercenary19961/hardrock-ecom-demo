import { lazy, Suspense, useMemo } from 'react';
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
        <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-gray-400">Loading chart...</span>
        </div>
    );
}

export function RevenueChart({ data }: RevenueChartProps) {
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand-purple" />
                    Revenue & Orders
                </h2>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-brand-purple" />
                        <span className="text-gray-600">Orders: {totals.orders}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-brand-orange" />
                        <span className="text-gray-600">Revenue: {totals.revenue.toFixed(2)} JOD</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px]">
                <Suspense fallback={<ChartLoadingFallback />}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                                label={{
                                    value: 'Orders',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fontSize: 12, fill: '#6b7280' },
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                                label={{
                                    value: 'Revenue (JOD)',
                                    angle: 90,
                                    position: 'insideRight',
                                    style: { fontSize: 12, fill: '#6b7280' },
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value, name) => [
                                    name === 'revenue' ? `${Number(value).toFixed(2)} JOD` : value,
                                    name === 'revenue' ? 'Revenue' : 'Orders',
                                ]}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value) => (value === 'revenue' ? 'Revenue' : 'Orders')}
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
