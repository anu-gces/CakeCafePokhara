import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
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
import { SearchIcon, SlidersHorizontal } from 'lucide-react'
import { Label } from './label'

import { Switch } from './switch'

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
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'receiptDate', desc: true },
  ])
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
        visibleColumns.length === 0 || visibleColumns.includes(id as string),
      ]),
    )
  }, [columns, visibleColumns])

  const [columnVisibility, setColumnVisibility] =
    React.useState(initialVisibility)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      sorting: [
        {
          id: 'receiptDate',
          desc: true, // descending by default
        },
      ],
    },
  })

  // Get filtered rows for virtualization
  const { rows } = table.getRowModel()

  // Create a ref for the table container
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside the visible area
  })
  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // Debug virtualization
  React.useEffect(() => {
    console.log(`📊 Virtualization Stats:
    - Total rows: ${rows.length}
    - Rendered rows: ${virtualItems.length}
    - Performance gain: ${Math.round((1 - virtualItems.length / rows.length) * 100)}%
    - Virtual height: ${totalSize}px`)
  }, [rows.length, virtualItems.length, totalSize])

  // const handleRowClick = (row: Row<TData>) => {
  //   setSelectedRow(row) // Set the selected row to show in the drawer
  //   setReceiptOpen(true) // Open the drawer
  // }

  return (
    <div className="flex flex-col pb-4 h-full overflow-y-clip">
      <div className="flex justify-between items-center py-2 w-full transition-all duration-1000">
        <div className="relative">
          <Label className="block relative max-w-sm cursor-pointer">
            <SearchIcon className="top-1/2 left-3 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
            <Input
              placeholder={`Filter ${filterColumnId}...`}
              value={
                (table.getColumn(filterColumnId)?.getFilterValue() as string) ??
                ''
              }
              onChange={(event) =>
                table
                  .getColumn(filterColumnId)
                  ?.setFilterValue(event.target.value)
              }
              className="pl-10 border border-input rounded-md w-8 focus:w-full h-9 text-sm transition-all duration-500 ease-in-out"
            />
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <Switch
              id="complementary-switch"
              checked={
                table.getColumn('complementary')?.getFilterValue() === true
              }
              onCheckedChange={(checked) => {
                const col = table.getColumn('complementary')
                col?.setFilterValue(checked ? true : undefined)
              }}
            />
            <Label
              htmlFor="complementary-switch"
              className="text-sm cursor-pointer select-none"
            >
              Toggle Complementary
            </Label>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="">
              <Button variant="outline" size="icon" className="gap-2 ml-4">
                <SlidersHorizontal className="size-5" />
                <span className="hidden">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => {
                if (column.getCanHide()) {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(value)
                      }
                    >
                      {
                        // Try to use meta.label, otherwise fallback to:
                        // string version of columnDef.header if it's a string
                        typeof column.columnDef.header === 'string'
                          ? column.columnDef.header
                          : (column.columnDef.meta?.label ?? column.id)
                      }
                    </DropdownMenuCheckboxItem>
                  )
                }
                return null
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        className="flex-grow h-full overflow-x-auto overflow-y-auto"
        ref={tableContainerRef}
      >
        <Table className="rounded-md">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* Top spacer */}
            {virtualItems.length > 0 && (
              <tr style={{ height: `${virtualItems[0].start}px` }} />
            )}

            {/* Render only virtualized rows */}
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  // onClick={() => handleRowClick(row)}
                  style={{ height: `${virtualRow.size}px` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}

            {/* Bottom spacer */}
            {virtualItems.length > 0 && (
              <tr
                style={{
                  height: `${totalSize - virtualItems[virtualItems.length - 1].end}px`,
                }}
              />
            )}
            {/* No results fallback */}
            {virtualItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Render Drawer When Row is Clicked */}
        {/* {selectedRow && (
          <ReceiptDrawer
            data={
              selectedRow.original as AddToCart & {
                processedBy: string
                receiptId: string
                receiptDate: string
              }
            }
            receiptOpen={receiptOpen}
            setReceiptOpen={setReceiptOpen}
          />
        )} */}
      </div>
      {/* <div className="flex justify-center items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <span className="text-nowrap">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
      </div> */}
    </div>
  )
}
