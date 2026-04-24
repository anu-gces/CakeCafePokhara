import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronLeft,
  ChevronRight,
  SearchIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumnId: string
  visibleColumns?: string[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
  visibleColumns = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  const initialVisibility = React.useMemo(() => {
    const allColumnIds = columns
      .map((col) => {
        if ('id' in col && col.id) return col.id
        if ('accessorKey' in col && typeof col.accessorKey === 'string')
          return col.accessorKey
        return null
      })
      .filter(Boolean) as string[]
    return Object.fromEntries(
      allColumnIds.map((id) => [
        id,
        visibleColumns.length === 0 || visibleColumns.includes(id),
      ]),
    )
  }, [columns, visibleColumns])

  const [columnVisibility, setColumnVisibility] =
    React.useState(initialVisibility)

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, columnVisibility },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 9 },
    },
  })

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center gap-3">
        <div className="relative max-w-xs">
          <SearchIcon className="top-1/2 left-3 absolute w-3.5 h-3.5 text-muted-foreground -translate-y-1/2" />
          <Input
            placeholder={`Filter ${filterColumnId}...`}
            value={
              (table.getColumn(filterColumnId)?.getFilterValue() as string) ??
              ''
            }
            onChange={(e) =>
              table.getColumn(filterColumnId)?.setFilterValue(e.target.value)
            }
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Pagination */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {table.getState().pagination.pageIndex + 1} /{' '}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => {
                if (!column.getCanHide()) return null
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-sm capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : (column.columnDef.meta?.label ?? column.id)}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/50 hover:bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-9 font-medium text-[11px] text-muted-foreground uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-border text-sm',
                    i % 2 === 1 && 'bg-muted/20',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-muted-foreground text-sm text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer count */}
      <div className="text-muted-foreground text-xs">
        Showing{' '}
        {table.getState().pagination.pageIndex *
          table.getState().pagination.pageSize +
          1}
        –
        {Math.min(
          (table.getState().pagination.pageIndex + 1) *
            table.getState().pagination.pageSize,
          table.getFilteredRowModel().rows.length,
        )}{' '}
        of {table.getFilteredRowModel().rows.length} rows
      </div>
    </div>
  )
}
