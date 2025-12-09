
'use server';

import { parseBancolombiaPDF } from '@/services/parser-bancolombia';
import { buildExcel } from '@/lib/xlsx-writer';

export async function convertirExtractoAction(form: FormData): Promise<{ data?: string; error?: string }> {
  try {
    const pdfFile = form.get('pdf') as File;

    if (!pdfFile) {
        return { error: "Se requiere un archivo PDF." };
    }

    const buf = Buffer.from(await pdfFile.arrayBuffer());
    const movimientos = await parseBancolombiaPDF(buf);
    
    if (movimientos.length === 0) {
        return { error: "No se encontraron movimientos válidos en el PDF. Asegúrate de que el formato sea el correcto." };
    }

    const excelBuffer = await buildExcel(movimientos);
    
    return { data: excelBuffer.toString('base64') };

  } catch (error: any) {
    console.error('[Convertir Extracto Action] Error:', error);
    return { error: error.message || "Error procesando el archivo PDF." };
  }
}
