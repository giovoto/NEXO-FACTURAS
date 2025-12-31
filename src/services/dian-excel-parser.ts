import * as XLSX from 'xlsx';
import { ParsedInvoice } from './xml-service';

/**
 * Parses DIAN Excel export file and converts rows to ParsedInvoice format
 */
export async function parseDianExcel(buffer: ArrayBuffer): Promise<ParsedInvoice[]> {
    try {
        console.log('📊 Parsing DIAN Excel export...');

        const workbook = XLSX.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        console.log(`   Found ${rows.length} total rows`);

        // Filter for "Recibidos" group
        const receivedDocs = rows.filter(row =>
            row.Grupo?.toLowerCase().includes('recibid') ||
            row['Grupo']?.toLowerCase().includes('recibid')
        );

        console.log(`   Filtered to ${receivedDocs.length} received documents`);

        // Convert to ParsedInvoice format
        const invoices: ParsedInvoice[] = receivedDocs.map(row => {
            const folio = row.Folio || row['Folio'] || '';
            const prefix = row.Prefijo || row['Prefijo'] || '';
            const invoiceNumber = prefix ? `${prefix}-${folio}` : folio;

            return {
                id: invoiceNumber,
                issueDate: convertDianDate(row['Fecha Emisión'] || row.FechaEmision || ''),
                dueDate: convertDianDate(row['Fecha Vencimiento'] || row.FechaVencimiento || row['Fecha Emisión'] || ''),
                supplierName: row['Nombre Emisor'] || row.NombreEmisor || '',
                supplierTaxId: row['NIT Emisor'] || row.NITEmisor || '',
                customerName: row['Nombre Receptor'] || row.NombreReceptor || '',
                customerTaxId: row['NIT Receptor'] || row.NITReceptor || '',
                total: parseFloat(row.Total || row.total || 0),
                subtotal: parseFloat(row.Subtotal || row.subtotal || 0) || (parseFloat(row.Total || 0) - parseFloat(row.IVA || 0)),
                taxes: parseFloat(row.IVA || row.iva || 0),
                reteFuente: parseFloat(row['Rete Renta'] || row.ReteRenta || 0),
                reteIVA: parseFloat(row['Rete IVA'] || row.ReteIVA || 0),
                reteICA: parseFloat(row['Rete ICA'] || row.ReteICA || 0),
                docType: 'Factura Electrónica De Venta',
                paymentMeans: row['Forma de Pago'] === '1' ? 'Contado' : 'Crédito',
                metadata: {
                    cufe: row.CUFE || row.cufe || '',
                    number: invoiceNumber,
                    estado: row.Estado || row.estado || '',
                    divisa: row.Divisa || row.divisa || 'COP'
                },
                lines: [] // Excel export doesn't include line items
            } as ParsedInvoice;
        });

        console.log(`✅ Successfully parsed ${invoices.length} invoices`);

        return invoices;

    } catch (error: any) {
        console.error('❌ Error parsing DIAN Excel:', error.message);
        return [];
    }
}

/**
 * Converts DIAN date format (DD-MM-YYYY) to YYYY-MM-DD
 */
function convertDianDate(dateStr: string): string {
    if (!dateStr) return '';

    // Handle "DD-MM-YYYY" or "DD/MM/YYYY" or "DD-MM-YYYY HH:MM:SS"
    const parts = dateStr.split(' ')[0].split(/[-\/]/);

    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return dateStr;
}
