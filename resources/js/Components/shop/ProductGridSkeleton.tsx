interface ProductGridSkeletonProps {
    count?: number;
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
                >
                    {/* Image placeholder */}
                    <div className="aspect-square bg-gray-200" />

                    {/* Content placeholder */}
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />

                        {/* Price */}
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
