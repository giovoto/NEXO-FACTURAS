'use client';

import { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Invoice } from '@/lib/types';

interface InvoiceTableProps {
  invoices: Invoice[];
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(
      (invoice) =>
        invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const handleDownloadXml = (
    xmlContent: string | undefined,
    invoiceNumber: string
  ) => {
    if (!xmlContent) return;
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${invoiceNumber}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por proveedor o número de factura..."
          className="w-full rounded-lg bg-background pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Factura</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice, index) => (
                <TableRow key={`${invoice.invoiceNumber}-${index}`}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.supplierName}</TableCell>
                  <TableCell className="text-right">{invoice.invoiceDate}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.vatAmount)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadXml(invoice.xmlContent, invoice.invoiceNumber)}
                            disabled={!invoice.xmlContent}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Descargar XML</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Descargar XML</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
