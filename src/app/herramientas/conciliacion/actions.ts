
'use server';

import { parseBancolombiaMovementsFromPdf } from '@/services/parser-bancolombia';
import { readSiigoExcel } from '@/services/read-siigo';
import { reconcile } from '@/services/reconcile';

export async function conciliarArchivosAction(form: FormData) {
  try {
    const pdfFiles = form.getAll('pdfs') as File[];
    const xlsx = form.get('siigo') as File;

    if (!xlsx || pdfFiles.length === 0) {
        return { error: "Se requiere un archivo de Siigo y al menos un extracto PDF." };
    }

    const movimientos = [];
    for (const f of pdfFiles) {
        const buf = Buffer.from(await f.arrayBuffer());
        const movs = await parseBancolombiaMovementsFromPdf(buf);
        movimientos.push(...movs);
    }

    const xbuf = Buffer.from(await xlsx.arrayBuffer());
    const asientos = readSiigoExcel(xbuf);

    const resultado = reconcile(movimientos, asientos, { dateWindowDays: 3 });
    return { data: resultado };

  } catch (error: any) {
    console.error('[API Conciliar] Error:', error);
    return { error: error.message || "Error procesando los archivos." };
  }
}
