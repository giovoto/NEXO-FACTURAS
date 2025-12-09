
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ParsedInvoice } from './xml-service';

export async function exportInvoicesToExcel(invoices: ParsedInvoice[], fileName: string = 'Consulta.xlsx') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Consulta');

    // Define columns matching the user's macro structure roughly
    // A: TrackId/CUFE
    // B: Tipo Doc
    // C: Eventos
    // D: Fecha Emisión
    // E: Serie
    // F: Folio
    // G: Valor (Subtotal)
    // H: IVA
    // I: Total
    // J: Emisor Nombre
    // K: Emisor NIT
    // L: Receptor Nombre
    // M: Receptor NIT
    // N: Tenedor
    // O: Link DIAN
    // P: Forma Pago
    // Q: Medio Pago
    // R: Subtotal Real
    // S: ReteFuente
    // T: ReteIVA
    // U: ReteICA
    // V: Total Pagar
    // W, X, Y -> Retentions details often duplicated in user macros
    // Z: Tipo Doc Detallado

    worksheet.columns = [
        { header: 'CUFE / UUID', key: 'cufe', width: 40 }, // A
        { header: 'Tipo Documento', key: 'docType', width: 25 }, // B
        { header: 'Eventos', key: 'events', width: 20 }, // C
        { header: 'Fecha Emisión', key: 'issueDate', width: 15 }, // D
        { header: 'Serie', key: 'serie', width: 10 }, // E
        { header: 'Folio', key: 'folio', width: 10 }, // F
        { header: 'Subtotal Base', key: 'subtotalBase', width: 15 }, // G
        { header: 'IVA', key: 'iva', width: 15 }, // H
        { header: 'Total Factura', key: 'total', width: 15 }, // I
        { header: 'Emisor Nombre', key: 'supplierName', width: 30 }, // J
        { header: 'Emisor NIT', key: 'supplierNit', width: 15 }, // K
        { header: 'Receptor Nombre', key: 'customerName', width: 30 }, // L
        { header: 'Receptor NIT', key: 'customerNit', width: 15 }, // M
        { header: 'Tenedor Actual', key: 'holder', width: 20 }, // N
        { header: 'Link DIAN', key: 'link', width: 15 }, // O
        { header: 'Forma Pago', key: 'paymentForm', width: 15 }, // P
        { header: 'Medio Pago', key: 'paymentMethod', width: 20 }, // Q
        { header: 'Subtotal Real', key: 'realSubtotal', width: 15 }, // R
        { header: 'ReteFuente', key: 'reteFuente', width: 15 }, // S
        { header: 'ReteIVA', key: 'reteIva', width: 15 }, // T
        { header: 'ReteICA', key: 'reteIca', width: 15 }, // U
        { header: 'Total a Pagar', key: 'payable', width: 15 }, // V
        { header: 'Tipo Doc (Detalle)', key: 'docTypeDetail', width: 25 }, // Z
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    // Add Rows
    invoices.forEach(inv => {
        // Determine row style or data logic
        const row = {
            cufe: inv.metadata?.cufe || '',
            docType: inv.docType || 'Factura Electrónica',
            events: 'Sin Evento', // TODO: Fetch events if available
            issueDate: inv.issueDate,
            serie: '', // Often part of ID or metadata
            folio: inv.metadata?.number || inv.id,
            subtotalBase: inv.subtotal,
            iva: (inv.taxes || 0) - (inv.reteFuente || 0) - (inv.reteIVA || 0) - (inv.reteICA || 0), // Simplification
            total: inv.total,
            supplierName: inv.supplierName,
            supplierNit: inv.supplierTaxId,
            customerName: inv.customerName,
            customerNit: inv.customerTaxId,
            holder: '', // Tenedor
            link: { text: 'Consultar', hyperlink: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${inv.metadata?.cufe}` },
            paymentForm: inv.paymentMeans,
            paymentMethod: 'Instrumento no definido', // Default
            realSubtotal: inv.subtotal,
            reteFuente: inv.reteFuente || 0,
            reteIva: inv.reteIVA || 0,
            reteIca: inv.reteICA || 0,
            payable: inv.total,
            docTypeDetail: inv.docType
        };

        worksheet.addRow(row);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Trigger download using file-saver
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
}
