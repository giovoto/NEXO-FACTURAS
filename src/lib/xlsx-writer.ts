
import ExcelJS from 'exceljs';
import type { RowOut } from '@/services/parser-bancolombia';

export async function buildExcel(rows: RowOut[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Movimientos');

  ws.columns = [
    { header: 'Fecha',            key: 'fecha',            width: 12 },
    { header: 'Descripción',      key: 'descripcion',      width: 60 },
    { header: 'Código Operación', key: 'codigo_operacion', width: 18 },
    { header: 'Importe',          key: 'importe',          width: 16, style: { numFmt: '#,##0.00;[Red]-#,##0.00' } },
    { header: 'Saldo',            key: 'saldo',            width: 16, style: { numFmt: '#,##0.00;[Red]-#,##0.00' } },
    { header: 'Tipo Movimiento',  key: 'tipo_movimiento',  width: 14 },
    { header: 'Fuente',           key: 'fuente',           width: 18 },
    { header: 'Imputación',       key: 'imputacion',       width: 24 },
  ];

  rows.forEach(r => {
    ws.addRow({
      ...r,
      fecha: new Date(r.fecha), // Convertir a objeto Date para que Excel lo reconozca
    });
  });

  // Estilo cabecera
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern:'solid',
    fgColor:{argb:'FF007BFF'}
  };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
