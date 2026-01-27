export function ReviewsSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <div key={star} className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                ))}
                            </div>
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
