'use client';

import { InvoiceViewer } from '@/components/dashboard/invoice-viewer';
import { ParsedInvoice } from '@/services/xml-service';

const mockInvoice: ParsedInvoice = {
    id: "SETT-10293",
    issueDate: "2024-12-08",
    dueDate: "2025-01-08",
    supplierName: "PROVEEDOR TECNOLOGICO S.A.S",
    supplierTaxId: "900.123.456",
    supplierAddress: "Calle 100 # 8A - 55, Bogotá D.C.",
    customerName: "TU EMPRESA S.A.S",
    customerTaxId: "800.987.654",
    currency: "COP",
    paymentMeans: "Crédito",
    total: 1190000,
    subtotal: 1000000,
    taxes: 190000,
    taxDetails: [
        { id: "01", name: "IVA", percent: 19, amount: 190000 }
    ],
    lines: [
        { description: "Licencia de Software Anual", qty: 1, price: 1000000, disk: 0, total: 1000000 }
    ],
    metadata: {
        number: "SETT-10293",
        cufe: "36d8713600e57283748283928374823"
    }
};

export default function TestViewerPage() {
    return (
        <div className="p-10 bg-slate-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">Prueba del Visor de Facturas</h1>
            <InvoiceViewer invoice={mockInvoice} />
        </div>
    );
}
