
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Edit } from 'lucide-react';

export type DatoContable = {
  id: string;
  titulo: string;
  descripcion: string;
};

type GetColumnsProps = {
  onEdit: (dato: DatoContable) => void;
}

export const columns = ({ onEdit }: GetColumnsProps): ColumnDef<DatoContable>[] => [
  {
    accessorKey: 'titulo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Título
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
     cell: ({ row }) => <div className="pl-4 font-medium">{row.original.titulo}</div>,
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => <div className="text-muted-foreground whitespace-pre-wrap">{row.original.descripcion}</div>,
  },
  {
    id: 'acciones',
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
        <Edit className="h-4 w-4" />
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
