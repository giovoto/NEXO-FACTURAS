
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLogs } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Download, CheckCircle, XCircle, Hourglass, Calendar } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table';
import { columns } from '@/components/columns';
import { SearchBar } from '@/components/ui/search-bar';
import { FilterBar, type FilterState } from '@/components/filter-bar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Autocomplete, type AutocompleteOption } from '@/components/ui/autocomplete';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type { Factura } from '@/lib/types';
import type { RowSelectionState } from '@tanstack/react-table';
import { ZipUploader } from '@/components/zip-uploader';
import { procesarCorreosAction, exportarFacturasAction } from '@/app/actions';
import type { User } from 'firebase/auth';
import { applyFilters, filtersToQueryParams, queryParamsToFilters, getEmptyFilters } from '@/lib/filter-utils';
import { DateRange } from 'react-day-picker';

export const runtime = 'nodejs';

// Helper to get ID token
async function getIdToken(user: User | null, forceRefresh = false): Promise<string> {
  if (!user) return '';
  return user.getIdToken(forceRefresh);
}


export default function InvoicesPage() {
  const [processing, setProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { addLog } = useLogs();
  const { user, facturas: initialFacturas, isFacturasLoading, reloadFacturas, handleStatusChange, activeEmpresaId, empresaRole } = useAuth();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize filters from URL or empty state
  const [filters, setFilters] = useState<FilterState>(() => {
    if (searchParams) {
      return queryParamsToFilters(searchParams);
    }
    return getEmptyFilters();
  });

  const canEdit = empresaRole === 'admin' || empresaRole === 'editor';

  // Update URL when filters change
  useEffect(() => {
    const params = filtersToQueryParams(filters);
    const newUrl = params.toString() ? `?${params.toString()}` : '/facturacion';
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  const handleBulkStatusChange = (newStatus: string) => {
    if (!canEdit) return;
    const selectedIds = Object.keys(rowSelection);
    selectedIds.forEach(id => handleStatusChange(id, newStatus));
    addLog('INFO', `Estado de ${selectedIds.length} facturas cambiado a ${newStatus}`);
    setRowSelection({});
  };

  const pageColumns = useMemo(() => columns({ onStatusChange: handleStatusChange, canEdit }), [handleStatusChange, canEdit]);

  // Get unique proveedores for autocomplete
  const proveedorOptions = useMemo<AutocompleteOption[]>(() => {
    const uniqueProveedores = Array.from(new Set(initialFacturas.map(f => f.nombreEmisor)));
    return uniqueProveedores.map(proveedor => ({
      value: proveedor,
      label: proveedor,
    }));
  }, [initialFacturas]);

  // Apply filters to facturas
  const filteredFacturas = useMemo(() => {
    return applyFilters(initialFacturas, filters, ['nombreEmisor', 'folio', 'categoria']);
  }, [initialFacturas, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearAllFilters = () => {
    setFilters(getEmptyFilters());
  };

  const handleProcess = async () => {
    if (!user || !activeEmpresaId || !canEdit) return;
    setProcessing(true);
    try {
      const idToken = await getIdToken(user, true);
      const result = await procesarCorreosAction(idToken, activeEmpresaId);
      addLog('SUCCESS', 'El procesamiento de correos ha comenzado en segundo plano.');
      alert(result.message);
      reloadFacturas(true);
    } catch (error: any) {
      addLog('ERROR', 'Error al iniciar el procesamiento', error.message);
      alert(`Error al iniciar el procesamiento: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }

  const handleExport = async () => {
    if (!user || !activeEmpresaId) return;
    setIsExporting(true);
    addLog('INFO', 'Solicitando exportación de facturas como CSV...');
    try {
      const idToken = await getIdToken(user, true);
      const result = await exportarFacturasAction(idToken, activeEmpresaId);
      if (result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.setAttribute('download', 'facturas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addLog('SUCCESS', 'Exportación a CSV generada y descarga iniciada.');
      } else {
        addLog('ERROR', 'La API no devolvió una URL para la exportación.');
      }
    } catch (error: any) {
      addLog('ERROR', `Falló la exportación a CSV: ${error.message}`, error.stack);
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = isFacturasLoading || !user;
  const numSelected = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Comprobantes</h1>
            <p className="text-muted-foreground mt-1">Gestiona, procesa y exporta tus comprobantes.</p>
          </div>
          <div className="flex w-full flex-col sm:w-auto sm:flex-row items-center gap-2">
            {canEdit && <ZipUploader onProcessComplete={() => reloadFacturas(true)} />}
            {canEdit && (
              <Button onClick={handleProcess} disabled={processing || isLoading || !activeEmpresaId} className="w-full sm:w-auto">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Procesar Correo
              </Button>
            )}
            <Button variant="outline" onClick={handleExport} disabled={isExporting || isLoading || initialFacturas.length === 0 || !activeEmpresaId} className="w-full sm:w-auto">
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Exportar
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <SearchBar
            onSearch={(query) => handleFilterChange({ search: query })}
            placeholder="Buscar por proveedor, número o categoría..."
            className="w-full"
            isLoading={isLoading}
          />

          {/* Filter Pills and Additional Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FilterBar
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAllFilters}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Date Range Picker */}
              <DateRangePicker
                value={filters.dateRange || undefined}
                onChange={(range: DateRange | undefined) => handleFilterChange({ dateRange: range || null })}
                className="w-full sm:w-[280px]"
                placeholder="Filtrar por fecha"
              />

              {/* Proveedor Autocomplete */}
              <Autocomplete
                options={proveedorOptions}
                value={filters.proveedor || undefined}
                onValueChange={(value) => handleFilterChange({ proveedor: value || null })}
                placeholder="Todos los proveedores"
                searchPlaceholder="Buscar proveedor..."
                emptyMessage="No se encontraron proveedores"
                className="w-full sm:w-[240px]"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{filteredFacturas.length}</span> de{' '}
            <span className="font-medium text-foreground">{initialFacturas.length}</span> comprobantes
          </div>
        </div>

        {/* Acciones masivas */}
        {numSelected > 0 && canEdit && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4 bg-muted/30 shadow-sm animate-in fade-in-0 duration-200">
            <p className="text-sm font-semibold text-foreground flex-grow">
              {numSelected} comprobante(s) seleccionado(s)
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('Aceptado')} className="gap-2">
                <CheckCircle className="h-4 w-4" /> Aceptar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('Rechazado')} className="gap-2">
                <XCircle className="h-4 w-4" /> Rechazar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('Procesado')} className="gap-2">
                <Hourglass className="h-4 w-4" /> En Proceso
              </Button>
            </div>
          </div>
        )}

        {/* Tabla de datos */}
        <DataTable
          columns={pageColumns}
          data={filteredFacturas}
          isLoading={isFacturasLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          canEdit={canEdit}
        />
      </div>
    </>
  );
}
