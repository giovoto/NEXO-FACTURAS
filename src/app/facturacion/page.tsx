
'use client';
import { useState, useMemo } from 'react';
import { useLogs } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Download, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table';
import { columns } from '@/components/columns';
import { SearchBar } from '@/components/search-bar';
import { StatusFilter } from '@/components/status-filter';
import type { Factura } from '@/lib/types';
import type { RowSelectionState } from '@tanstack/react-table';
import { ZipUploader } from '@/components/zip-uploader';
import { procesarCorreosAction, exportarFacturasAction } from '@/app/actions';
import type { User } from 'firebase/auth';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const canEdit = empresaRole === 'admin' || empresaRole === 'editor';

  const handleBulkStatusChange = (newStatus: string) => {
    if (!canEdit) return;
    const selectedIds = Object.keys(rowSelection);
    selectedIds.forEach(id => handleStatusChange(id, newStatus));
    addLog('INFO', `Estado de ${selectedIds.length} facturas cambiado a ${newStatus}`);
    setRowSelection({});
  };

  const pageColumns = useMemo(() => columns({ onStatusChange: handleStatusChange, canEdit }), [handleStatusChange, canEdit]);

  // Calcular contadores por estado
  const statusCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Aceptado': 0,
      'Rechazado': 0,
      'Procesado': 0
    };
    initialFacturas.forEach(f => {
      if (counts[f.estado] !== undefined) {
        counts[f.estado]++;
      }
    });
    return counts;
  }, [initialFacturas]);

  const filteredFacturas = useMemo(() => {
    let filtered = initialFacturas;

    // Filtrar por estado
    if (activeStatus) {
      filtered = filtered.filter(f => f.estado === activeStatus);
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.nombreEmisor.toLowerCase().includes(query) ||
        f.folio.toLowerCase().includes(query) ||
        (f.categoria && f.categoria.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [initialFacturas, activeStatus, searchQuery]);

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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comprobantes</h1>
            <p className="text-muted-foreground">Gestiona, procesa y exporta tus comprobantes.</p>
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


        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por proveedor, número o categoría..."
              className="flex-1"
            />
          </div>

          <StatusFilter
            statuses={[
              { label: 'Aceptados', value: 'Aceptado', variant: 'success', count: statusCounts['Aceptado'] },
              { label: 'En Proceso', value: 'Procesado', variant: 'warning', count: statusCounts['Procesado'] },
              { label: 'Rechazados', value: 'Rechazado', variant: 'destructive', count: statusCounts['Rechazado'] },
            ]}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
          />
        </div>

        {/* Acciones masivas */}
        {numSelected > 0 && canEdit && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4 bg-muted/30 shadow-sm">
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
