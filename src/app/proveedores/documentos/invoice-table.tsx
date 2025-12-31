'use client';

import { ParsedInvoice } from '@/services/xml-service';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface InvoiceTableProps {
    invoices: ParsedInvoice[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('es-CO', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    if (invoices.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                <p>No hay facturas disponibles</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Folio</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>NIT</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice, index) => (
                        <TableRow key={invoice.id || index} className="hover:bg-slate-50">
                            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                            <TableCell className="font-medium">{invoice.metadata?.number || invoice.id}</TableCell>
                            <TableCell className="max-w-xs truncate" title={invoice.supplierName}>
                                {invoice.supplierName}
                            </TableCell>
                            <TableCell>{invoice.supplierTaxId}</TableCell>
                            <TableCell className="text-right font-semibold">
                                {formatCurrency(invoice.total)}
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.metadata?.estado?.toLowerCase().includes('aprobado')
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {invoice.metadata?.estado || 'Procesada'}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
