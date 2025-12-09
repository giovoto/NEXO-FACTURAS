'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Edit } from 'lucide-react';

export type Contacto = {
  id: string;
  proveedor: string;
  identificacion: string;
  email: string | null;
  telefono: string | null;
};

type GetColumnsProps = {
  onEdit: (contact: Contacto) => void;
  canEdit: boolean;
}

export const columns = ({ onEdit, canEdit }: GetColumnsProps): ColumnDef<Contacto>[] => [
  {
    accessorKey: 'proveedor',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Proveedor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
     cell: ({ row }) => <div className="pl-4">{row.original.proveedor}</div>,
  },
  {
    accessorKey: 'identificacion',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Identificación
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
     cell: ({ row }) => row.original.email || 'N/A',
  },
  {
    accessorKey: 'telefono',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Teléfono
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.telefono || 'N/A',
  },
  {
    id: 'acciones',
    cell: ({ row }) => (
      canEdit ? (
        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
          <Edit className="h-4 w-4" />
        </Button>
      ) : null
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
