import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function TableSkeleton({
    rows = 5,
    columns = 6,
    className,
}: TableSkeletonProps) {
    return (
        <div className={cn('w-full space-y-3', className)}>
            {/* Header */}
            <div className="flex gap-4 pb-3 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton
                        key={`header-${i}`}
                        variant="text"
                        className="h-5"
                        width={i === 0 ? '40px' : i === columns - 1 ? '60px' : '120px'}
                    />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex gap-4 py-3 border-b border-border/50">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            variant="text"
                            className="h-4"
                            width={
                                colIndex === 0
                                    ? '40px'
                                    : colIndex === columns - 1
                                        ? '60px'
                                        : colIndex === 1
                                            ? '180px'
                                            : '100px'
                            }
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
