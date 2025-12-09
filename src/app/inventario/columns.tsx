'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Edit, MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ProductoInventario = {
  id: string;
  producto: string;
  sku: string | null;
  cantidad: number;                  // fijo, pero puede venir 0
  customFields?: Record<string, any>; // dinámicos desde el import
};

type GetColumnsProps = {
  onEdit: (product: ProductoInventario) => void;
  data: ProductoInventario[]; // pasa los datos (o una muestra) para descubrir columnas
};

// --- helpers ---
const NUM_KEYS = ['cantidad', 'stock', 'existencias', 'qty'];
const FIXED_KEYS = new Set(['id', 'producto', 'sku', 'cantidad']);

const normalizeNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return Number.isFinite(val) ? val : NaN;
  const s = String(val).trim();
  if (!s) return NaN;
  // quita miles y estandariza decimal como punto
  const norm = s
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(/,/, '.');
  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : NaN;
};

const findQuantity = (product: ProductoInventario): number => {
  const cf = product.customFields || {};
  // busca primero en customFields (cantidad/stock/existencias/qty)
  for (const key in cf) {
    if (NUM_KEYS.includes(key.toLowerCase())) {
      const v = normalizeNumber(cf[key]);
      if (!Number.isNaN(v)) return v;
    }
  }
  // fallback al campo fijo cantidad (permitiendo 0)
  const base = normalizeNumber(product.cantidad);
  return Number.isNaN(base) ? 0 : base;
};

const discoverDynamicKeys = (data: ProductoInventario[]) => {
  const set = new Set<string>();
  for (const row of data) {
    const cf = row?.customFields || {};
    for (const k of Object.keys(cf)) {
      // omite claves fijas y las numéricas de cantidad (porque ya hay columna dedicada)
      if (FIXED_KEYS.has(k as any)) continue;
      if (NUM_KEYS.includes(k.toLowerCase())) continue;
      set.add(k);
    }
  }
  return Array.from(set);
};

/**
 * Construye columnas adaptadas a lo importado:
 * - fijas: select, producto, sku, cantidad, acciones
 * - dinámicas: todas las llaves de customFields (excepto cantidad/stock/existencias/qty y fijos)
 */
export const buildColumns = ({ onEdit, data }: GetColumnsProps): ColumnDef<ProductoInventario>[] => {
  const dynamicKeys = discoverDynamicKeys(data);

  const base: ColumnDef<ProductoInventario>[] = [
    // Selección
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // Producto (string libre del import)
    {
      accessorKey: 'producto',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Producto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.producto ?? '—',
    },

    // SKU (puede venir en customFields; si lo mapeaste allí, pásalo a sku en el import)
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => row.original.sku ?? 'N/A',
    },
  ];

  // Dinámicas desde customFields (marcas, serial, referencia, codigoSap, etc.)
  const dynamicCols: ColumnDef<ProductoInventario>[] = dynamicKeys.map((key) => ({
    id: `cf:${key}`,
    header: key,
    cell: ({ row }) => {
      const v = row.original.customFields?.[key];
      return v ?? '—';
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.customFields?.[key];
      const b = rowB.original.customFields?.[key];
      // si ambos parecen números, ordena numéricamente
      const na = normalizeNumber(a);
      const nb = normalizeNumber(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
    },
  }));

  // Cantidad dinámica (lee de customFields o del campo fijo)
  const qtyCol: ColumnDef<ProductoInventario> = {
    id: 'cantidad',
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
    cell: ({ row }) => {
      const qty = findQuantity(row.original);
      return <div className="text-center">{Number.isFinite(qty) ? qty : 0}</div>;
    },
    sortingFn: (rowA, rowB) => {
      const a = findQuantity(rowA.original);
      const b = findQuantity(rowB.original);
      const na = Number.isFinite(a) ? a : -Infinity;
      const nb = Number.isFinite(b) ? b : -Infinity;
      return na - nb;
    },
  };

  const actions: ColumnDef<ProductoInventario> = {
    id: 'acciones',
    cell: ({ row }) => (
      <div className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(row.original)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Editar Producto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };

  // Orden final: select | producto | sku | dinámicas | cantidad | acciones
  return [...base, ...dynamicCols, qtyCol, actions];
};
