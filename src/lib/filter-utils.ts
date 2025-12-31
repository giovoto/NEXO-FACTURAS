import { FilterState } from '@/components/filter-bar';

/**
 * Apply combined filters to a dataset
 */
export function applyFilters<T extends Record<string, any>>(
    data: T[],
    filters: FilterState,
    searchFields: (keyof T)[]
): T[] {
    return data.filter((item) => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = searchFields.some((field) => {
                const value = item[field];
                if (value == null) return false;
                return String(value).toLowerCase().includes(searchLower);
            });
            if (!matchesSearch) return false;
        }

        // Estado filter
        if (filters.estado.length > 0) {
            if (!filters.estado.includes(item.estado as string)) {
                return false;
            }
        }

        // Date range filter
        if (filters.dateRange?.from && filters.dateRange?.to) {
            const itemDate = new Date(item.fecha as string);
            const fromDate = new Date(filters.dateRange.from);
            const toDate = new Date(filters.dateRange.to);

            // Set to start/end of day for accurate comparison
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate < fromDate || itemDate > toDate) {
                return false;
            }
        }

        // Proveedor filter
        if (filters.proveedor) {
            if (item.nombreEmisor !== filters.proveedor) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Serialize filters to URL query params
 */
export function filtersToQueryParams(filters: FilterState): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.search) {
        params.set('search', filters.search);
    }

    if (filters.estado.length > 0) {
        params.set('estado', filters.estado.join(','));
    }

    if (filters.dateRange?.from) {
        params.set('from', filters.dateRange.from.toISOString());
    }

    if (filters.dateRange?.to) {
        params.set('to', filters.dateRange.to.toISOString());
    }

    if (filters.proveedor) {
        params.set('proveedor', filters.proveedor);
    }

    return params;
}

/**
 * Deserialize URL query params to filters
 */
export function queryParamsToFilters(params: URLSearchParams): FilterState {
    const filters: FilterState = {
        search: params.get('search') || '',
        estado: params.get('estado')?.split(',').filter(Boolean) || [],
        dateRange: null,
        proveedor: params.get('proveedor') || null,
    };

    const from = params.get('from');
    const to = params.get('to');

    if (from && to) {
        filters.dateRange = {
            from: new Date(from),
            to: new Date(to),
        };
    }

    return filters;
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: FilterState): number {
    let count = 0;

    if (filters.search) count++;
    if (filters.estado.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.proveedor) count++;

    return count;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
    return countActiveFilters(filters) > 0;
}

/**
 * Get empty filter state
 */
export function getEmptyFilters(): FilterState {
    return {
        search: '',
        estado: [],
        dateRange: null,
        proveedor: null,
    };
}
