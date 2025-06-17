import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
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
import { Label } from './label'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './drawer'
import { type AddToCart } from '../restaurant_mobile/editMenu'
import CakeCafeLogo from '@/assets/Logob.png'
import { format } from 'date-fns'
import { ScrollArea } from '@radix-ui/react-scroll-area'
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

  const [selectedRow, setSelectedRow] = React.useState<Row<TData> | null>(null)
  const [receiptOpen, setReceiptOpen] = React.useState(false)
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 6,
      },
      sorting: [
        {
          id: 'receiptDate',
          desc: true, // descending by default
        },
      ],
    },
  })

  const handleRowClick = (row: Row<TData>) => {
    setSelectedRow(row) // Set the selected row to show in the drawer
    setReceiptOpen(true) // Open the drawer
  }

  return (
    <div className="flex flex-col pb-4 h-full">
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
      <div className="flex-grow h-full">
        <Table className="border rounded-md">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => handleRowClick(row)} // Handle row click
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
              ))
            ) : (
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
        {selectedRow && (
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
        )}
      </div>
      <div className="flex justify-center items-center space-x-2">
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
      </div>
    </div>
  )
}

function ReceiptDrawer({
  data,
  receiptOpen,
  setReceiptOpen,
}: {
  data: AddToCart & {
    processedBy: string
    receiptId: string
    receiptDate: string
  }
  receiptOpen: boolean
  setReceiptOpen: (open: boolean) => void
}) {
  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={receiptOpen}
      onOpenChange={setReceiptOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <div className="flex md:flex-row flex-col md:justify-center lg:justify-center items-center gap-4 p-2">
            <div className="flex items-center gap-4">
              <img
                src={CakeCafeLogo}
                width="48"
                height="48"
                alt="Company Logo"
                className="rounded-md"
              />
              <div className="gap-2 grid">
                <DrawerTitle className="font-bold text-xl">
                  Cake Cafe<sup className="text-[12px]">TM</sup>
                </DrawerTitle>
                <DrawerDescription className="text-gray-500 dark:text-gray-400 text-sm">
                  Jwalakhel-8, Pokhara
                  <br />
                  Phone: +061-531234
                  <br />
                  Email: info@CakeCafe.com.np
                </DrawerDescription>
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="mx-auto w-full print:max-w-[300px] max-w-sm font-mono print:text-xs text-sm">
          <div className="bg-white dark:bg-black p-4 border border-border">
            <h2 className="mb-4 font-bold text-center">Receipt</h2>
            <div className="mb-4 text-xs text-center">
              <div>ID: {data.receiptId}</div>
              <div>
                Date:{' '}
                {format(new Date(data.receiptDate), "yyyy-MM-dd '@' hh:mm a")}
              </div>
            </div>
            <ScrollArea className="h-72 overflow-y-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.foodId}>
                      <TableCell>{item.foodName}</TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-right">
                        Rs.{(item.qty * item.foodPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold text-right">
                      Sub Total
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      Rs.
                      {data.items
                        .reduce(
                          (sum, item) => sum + item.foodPrice * item.qty,
                          0,
                        )
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Discount ({data.discountRate}%)
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      - Rs.
                      {(
                        data.items.reduce(
                          (sum, item) => sum + item.foodPrice * item.qty,
                          0,
                        ) *
                        (data.discountRate / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Tax ({data.taxRate}%)
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      + Rs.
                      {(
                        (data.items.reduce(
                          (sum, item) => sum + item.foodPrice * item.qty,
                          0,
                        ) -
                          data.items.reduce(
                            (sum, item) => sum + item.foodPrice * item.qty,
                            0,
                          ) *
                            (data.discountRate / 100)) *
                        (data.taxRate / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="text-gray-500 text-xs text-left">
                      Processed By: {data.processedBy}
                    </TableCell>
                    <TableCell className="font-semibold text-right">
                      Total
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      Rs.
                      {(
                        (data.items.reduce(
                          (sum, item) => sum + item.foodPrice * item.qty,
                          0,
                        ) -
                          data.items.reduce(
                            (sum, item) => sum + item.foodPrice * item.qty,
                            0,
                          ) *
                            (data.discountRate / 100)) *
                        (1 + data.taxRate / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
