'use client';

import { ParsedInvoice } from '@/services/xml-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface InvoiceViewerProps {
    invoice: ParsedInvoice;
}

export function InvoiceViewer({ invoice }: InvoiceViewerProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: invoice.currency || 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg bg-white print:shadow-none">
            <CardHeader className="border-b bg-slate-50/50 print:hidden">
                <div className="flex justify-between items-center">
                    <CardTitle>Vista Previa de Factura Electrónica</CardTitle>
                    <Badge variant="outline">{invoice.metadata?.number}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8 font-sans">

                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{invoice.supplierName}</h1>
                        <p className="text-sm text-slate-500">NIT: {invoice.supplierTaxId}</p>
                        <p className="text-sm text-slate-500 max-w-[250px]">{invoice.supplierAddress}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-semibold text-slate-700">Factura de Venta</h2>
                        <p className="text-xl font-bold text-primary">{invoice.metadata?.number}</p>
                        <div className="mt-2 text-sm text-slate-600">
                            <p>Fecha Emisión: {invoice.issueDate}</p>
                            <p>Vencimiento: {invoice.dueDate}</p>
                        </div>
                    </div>
                </div>

                {/* Client Section */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">Cliente / Adquirente</h3>
                            <p className="font-medium">{invoice.customerName}</p>
                            <p className="text-sm text-slate-500">NIT: {invoice.customerTaxId}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">Detalles de Pago</h3>
                            <p className="text-sm"><span className="font-medium">Forma de Pago:</span> {invoice.paymentMeans}</p>
                            <p className="text-sm"><span className="font-medium">Moneda:</span> {invoice.currency}</p>
                        </div>
                    </div>
                </div>

                {/* Lines Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Descripción</TableHead>
                            <TableHead className="text-right">Cant.</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.lines.map((line, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium text-sm">{line.description}</TableCell>
                                <TableCell className="text-right">{line.qty}</TableCell>
                                <TableCell className="text-right">{formatCurrency(line.price)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(line.total)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Totals Section */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span>{formatCurrency(invoice.subtotal || 0)}</span>
                        </div>

                        {invoice.taxDetails && invoice.taxDetails.length > 0 && (
                            <div className="border-t border-slate-100 py-2 space-y-1">
                                {invoice.taxDetails.map((tax, i) => (
                                    <div key={i} className="flex justify-between text-xs text-slate-600">
                                        <span>{tax.name} ({tax.percent}%)</span>
                                        <span>{formatCurrency(tax.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between text-base font-bold border-t pt-2 text-slate-900">
                            <span>Total a Pagar</span>
                            <span>{formatCurrency(invoice.total || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer / CUFE */}
                <div className="text-[10px] text-slate-400 break-all text-center border-t pt-4">
                    CUFE: {invoice.metadata?.cufe}
                </div>

            </CardContent>
        </Card>
    );
}
