export function ChartSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-end justify-around px-4 pb-4 gap-2">
                {/* Simulated bar chart skeleton */}
                {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((height, i) => (
                    <div
                        key={i}
                        className="bg-gray-200 rounded-t w-full"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
