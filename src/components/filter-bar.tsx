'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export interface FilterState {
    search: string;
    estado: string[];
    dateRange: DateRange | null;
    proveedor: string | null;
}

interface FilterBarProps {
    activeFilters: FilterState;
    onFilterChange: (filters: Partial<FilterState>) => void;
    onClearAll: () => void;
    className?: string;
}

const estadoOptions = [
    { value: 'all', label: 'Todos', variant: 'outline' as const },
    { value: 'Procesado', label: 'Procesado', variant: 'warning' as const },
    { value: 'Aceptado', label: 'Aceptado', variant: 'success' as const },
    { value: 'Rechazado', label: 'Rechazado', variant: 'destructive' as const },
];

export function FilterBar({
    activeFilters,
    onFilterChange,
    onClearAll,
    className,
}: FilterBarProps) {
    const activeFilterCount = React.useMemo(() => {
        let count = 0;
        if (activeFilters.search) count++;
        if (activeFilters.estado.length > 0) count++;
        if (activeFilters.dateRange) count++;
        if (activeFilters.proveedor) count++;
        return count;
    }, [activeFilters]);

    const handleEstadoToggle = (estado: string) => {
        if (estado === 'all') {
            onFilterChange({ estado: [] });
        } else {
            const newEstados = activeFilters.estado.includes(estado)
                ? activeFilters.estado.filter((e) => e !== estado)
                : [...activeFilters.estado, estado];
            onFilterChange({ estado: newEstados });
        }
    };

    const isEstadoActive = (estado: string) => {
        if (estado === 'all') {
            return activeFilters.estado.length === 0;
        }
        return activeFilters.estado.includes(estado);
    };

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {/* Estado Pills */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                    Estado:
                </span>
                {estadoOptions.map((option) => (
                    <Badge
                        key={option.value}
                        variant={isEstadoActive(option.value) ? option.variant : 'outline'}
                        className={cn(
                            'cursor-pointer transition-all hover:opacity-80',
                            !isEstadoActive(option.value) && 'opacity-60'
                        )}
                        onClick={() => handleEstadoToggle(option.value)}
                    >
                        {option.label}
                    </Badge>
                ))}
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in-0 duration-200">
                    <span className="text-sm text-muted-foreground">
                        {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Limpiar todos
                    </Button>
                </div>
            )}
        </div>
    );
}
