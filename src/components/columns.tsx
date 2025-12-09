
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from './ui/button';
import { ArrowUpDown, MoreHorizontal, CheckCircle, XCircle, Hourglass, AlertCircle, Link2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type Factura = {
  [key: string]: string | number;
};

type GetColumnsProps = {
  onStatusChange: (facturaId: string, newStatus: string) => void;
  canEdit: boolean;
};

const estadoVariants: { [key: string]: "success" | "warning" | "destructive" | "ghost" } = {
  Procesado: "warning",
  Aceptado: "success",
  Rechazado: "destructive"
};

const formatDate = (value: any) => {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    // Set time to midnight to compare dates only
    date.setUTCHours(0, 0, 0, 0);
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  } catch (e) {
    return 'N/A';
  }
}

export const columns = ({ onStatusChange, canEdit }: GetColumnsProps): ColumnDef<Factura>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        disabled={!canEdit}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        disabled={!canEdit}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'nombreEmisor',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Proveedor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const siigoId = row.original.siigoId as string | undefined;
      return (
        <div className="pl-4 font-medium flex items-center gap-2">
          <span>{row.original.nombreEmisor as string}</span>
          {siigoId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Link2 className="h-4 w-4 text-primary/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sincronizado con Siigo (ID: {siigoId})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'folio',
    header: 'Número',
  },
  {
    accessorKey: 'categoria',
    header: 'Categoría',
    cell: ({ row }) => row.original.categoria ? <Badge variant="outline">{row.original.categoria as string}</Badge> : 'N/A',
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha Emisión',
    cell: ({ row }) => formatDate(row.original.fecha)
  },
  {
    accessorKey: 'fechaVencimiento',
    header: 'Vencimiento',
    cell: ({ row }) => {
      const fechaVencimiento = row.original.fechaVencimiento as string;
      if (!fechaVencimiento) return 'N/A';

      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);
      const fechaVence = new Date(fechaVencimiento);
      fechaVence.setUTCHours(0, 0, 0, 0);

      const estaVencida = fechaVence < hoy;

      return (
        <div className={cn("flex items-center gap-2", estaVencida && "text-destructive font-medium")}>
          {formatDate(fechaVencimiento)}
          {estaVencida && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Este comprobante está vencido.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'valorTotal',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valorTotal"))
      const formatted = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado as string;
      const variant = estadoVariants[estado] || 'ghost';
      return (
        <Badge variant={variant}>
          {estado}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const factura = row.original;
      if (!canEdit) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusChange(factura.id as string, 'Aceptado')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como Aceptado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(factura.id as string, 'Rechazado')}>
              <XCircle className="mr-2 h-4 w-4" />
              Marcar como Rechazado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(factura.id as string, 'Procesado')}>
              <Hourglass className="mr-2 h-4 w-4" />
              Marcar en Proceso
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
];
