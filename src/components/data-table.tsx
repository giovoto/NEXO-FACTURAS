
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/table-skeleton';
import { FileX, Search } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface DataTableFilter {
  id: string;
  placeholder: string;
  icon?: React.ReactNode;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  filters?: DataTableFilter[];
  rowSelection?: RowSelectionState;
  setRowSelection?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  canEdit?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  filters = [],
  rowSelection = {},
  setRowSelection,
  canEdit = true,
  emptyMessage = 'No se encontraron resultados.',
  emptyIcon,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: canEdit,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="w-full space-y-4">
      {filters.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="relative flex items-center">
              {filter.icon && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {filter.icon}
                </span>
              )}
              <Input
                placeholder={filter.placeholder}
                value={(table.getColumn(filter.id)?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn(filter.id)?.setFilterValue(event.target.value)
                }
                className={filter.icon ? "max-w-sm pl-11" : "max-w-sm"}
              />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="bg-muted/30 font-semibold text-foreground h-12"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-0">
                    <TableSkeleton rows={5} columns={columns.length} />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors duration-150",
                      "border-b border-border/50 last:border-0",
                      row.getIsSelected() && "bg-muted/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 px-6">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      {emptyIcon || <FileX className="h-12 w-12 opacity-50" />}
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{emptyMessage}</p>
                        <p className="text-xs">
                          Intenta ajustar los filtros o agregar nuevos datos.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <>
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} fila(s) seleccionadas
            </>
          ) : (
            <>
              Mostrando {table.getRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} resultado(s)
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground px-2">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
