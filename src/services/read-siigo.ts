
import * as XLSX from 'xlsx';
import type { AsientoSiigo } from '@/lib/types';

const money = (x: any) => {
    if (x === null || x === undefined) return 0;
    const value = Number(String(x).replace(/[^\d.-]/g, ''));
    return isNaN(value) ? 0 : value;
};


export function readSiigoExcel(buffer: Buffer): AsientoSiigo[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

  const cleanRows = rows.filter(r => r && (r['Fecha'] || r['Descripción'] || r['Débito'] || r['Crédito']));

  return cleanRows.map(r => ({
    fecha: r['Fecha'] ? new Date(r['Fecha']).toISOString().slice(0, 10) : '',
    descripcion: r['Descripción'] || r['Concepto'] || 'N/A',
    debito: money(r['Débito']),
    credito: money(r['Crédito']),
    tercero: r['Tercero'] || '',
    cuenta: String(r['Cuenta'] || ''),
    numeroDoc: String(r['Documento'] || ''),
    fuente: 'siigo',
  }));
}
