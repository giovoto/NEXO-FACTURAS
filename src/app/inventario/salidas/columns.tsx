'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type Salida = {
  id: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  destinatario: string;
  date: string; // ISO String
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const columns: ColumnDef<Salida>[] = [
  {
    accessorKey: 'productName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Producto
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
     cell: ({ row }) => <div className="pl-4 font-medium">{row.original.productName}</div>,
  },
  {
    accessorKey: 'warehouseName',
    header: 'Bodega',
    cell: ({ row }) => <Badge variant="outline">{row.original.warehouseName}</Badge>,
  },
   {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Cantidad
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-center font-bold">{row.original.quantity}</div>,
  },
  {
    accessorKey: 'destinatario',
    header: 'Destinatario / Motivo',
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha de Salida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-right">{formatDate(row.original.date)}</div>,
  },
];
