
'use server';

import { money, toISO, guessCodigoOperacion } from '@/lib/pdf-utils';
import { REGLAS_IMPUTACION } from '@/lib/imputacion-rules';
import { extractPdfText } from './pdf-service';
import type { MovimientoBanco } from '@/lib/types';

export type RowOut = {
  fecha: string;
  descripcion: string;
  codigo_operacion: string;
  importe: number;
  saldo: number | null;
  tipo_movimiento: 'DEBITO' | 'CREDITO';
  fuente: 'bancolombia_pdf';
  imputacion: string;
};

const DATE_RE = /^\d{4}\/\d{2}\/\d{2}\b/;
const ROW_RE_VALOR = /^(?<fecha>\d{4}\/\d{2}\/\d{2})\s+(?<desc>.+?)\s+(?<valor>-?\s?\d[\d,.]*)$/;

async function getTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
    try {
      return await extractPdfText(new Uint8Array(buffer));
    } catch(e) {
      console.error("Error extracting PDF text, trying fallback.", e);
      // Fallback or re-throw as needed. For now, we assume it's critical.
      throw new Error("No se pudo extraer el texto del PDF. Asegúrate de que no esté protegido por contraseña o dañado.");
    }
}


export async function parseBancolombiaPDF(buffer: ArrayBuffer): Promise<RowOut[]> {
  const text = await getTextFromPdfBuffer(buffer);
  const lines = (text || '')
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const rows: string[] = [];
  for (const line of lines) {
    if (DATE_RE.test(line)) rows.push(line);
    else if (rows.length)   rows[rows.length - 1] += ` ${line}`;
  }

  const out: RowOut[] = [];
  for (const raw of rows) {
    if (/^Página\s+\d+\s+de/i.test(raw)) continue;
    if (/^Empresa:|^NIT:|^Saldo|^Número de Cuenta:|^Fecha y Hora/i.test(raw)) continue;

    const m = raw.match(ROW_RE_VALOR);
    if (!m?.groups) continue;

    const fecha = toISO(m.groups.fecha, 'yyyy/MM/dd');
    const descripcion = m.groups.desc.replace(/\s{2,}/g, ' ').trim();
    const importe = money(m.groups.valor);
    const tipo_movimiento: 'DEBITO' | 'CREDITO' = importe < 0 ? 'DEBITO' : 'CREDITO';
    const saldo = null;

    const codigo_operacion = guessCodigoOperacion(descripcion);
    const regla = REGLAS_IMPUTACION.find(r => r.test.test(descripcion))!;
    const imputacion = regla.imputacion;

    out.push({
      fecha,
      descripcion,
      codigo_operacion,
      importe,
      saldo,
      tipo_movimiento,
      fuente: 'bancolombia_pdf',
      imputacion
    });
  }
  return out;
}

export async function parseBancolombiaMovementsFromPdf(buffer: ArrayBuffer): Promise<MovimientoBanco[]> {
    const rows = await parseBancolombiaPDF(buffer);
    return rows.map(r => ({
        fecha: r.fecha,
        descripcion: r.descripcion,
        importe: r.importe,
        banco: 'Bancolombia',
        fuente: 'pdf'
    }));
}
