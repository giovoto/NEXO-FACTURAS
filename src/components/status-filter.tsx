'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusFilterProps {
    statuses: {
        label: string;
        value: string;
        variant?: 'default' | 'success' | 'warning' | 'destructive' | 'ghost';
        count?: number;
    }[];
    activeStatus: string | null;
    onStatusChange: (status: string | null) => void;
    className?: string;
}

export function StatusFilter({
    statuses,
    activeStatus,
    onStatusChange,
    className
}: StatusFilterProps) {
    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            <span className="text-sm font-medium text-foreground mr-1">Estado:</span>

            <button
                onClick={() => onStatusChange(null)}
                className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                    activeStatus === null
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
            >
                Todos
            </button>

            {statuses.map((status) => (
                <button
                    key={status.value}
                    onClick={() => onStatusChange(status.value)}
                    className={cn(
                        "relative px-4 py-2 rounded-full text-xs font-semibold transition-all",
                        activeStatus === status.value
                            ? "shadow-sm ring-2 ring-ring ring-offset-2"
                            : "hover:shadow-sm"
                    )}
                >
                    <Badge
                        variant={activeStatus === status.value ? status.variant : 'ghost'}
                        className="cursor-pointer"
                    >
                        {status.label}
                        {status.count !== undefined && (
                            <span className="ml-1.5 opacity-75">({status.count})</span>
                        )}
                    </Badge>
                </button>
            ))}
        </div>
    );
}
