import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import type { AddToCart } from '@/routes/home/takeOrder'
import { Button } from '../ui/button'
import { ArrowUpDownIcon } from 'lucide-react'

export const columns: ColumnDef<
  AddToCart & {
    processedBy: string
    receiptId: string
    receiptDate: string
    subTotalAmount: number
    totalAmount: number
  }
>[] = [
  {
    accessorKey: 'receiptId',
    id: 'receiptId',
    header: 'Receipt ID',
  },
  {
    accessorKey: 'subTotalAmount',
    id: 'subTotalAmount',
    header: 'Sub Total Amount',
    cell: ({ getValue }) => `Rs. ${getValue<number>().toFixed(2)}`, // Format the value with "Rs." and two decimal places
  },
  {
    accessorKey: 'discountRate',
    id: 'discountRate',
    header: 'Discount Rate',
    cell: ({ getValue }) => `${getValue<number>()}%`, // Format the value as a percentage
  },
  {
    accessorKey: 'taxRate',
    id: 'taxRate',
    header: 'Tax Rate',
    cell: ({ getValue }) => `${getValue<number>()}%`, // Format the value as a percentage
  },

  {
    accessorKey: 'totalAmount',
    id: 'totalAmount',
    header: 'Total Amount',
    cell: ({ getValue }) => `Rs. ${getValue<number>().toFixed(2)}`, // Format the value with "Rs." and two decimal places
  },

  {
    accessorKey: 'receiptDate',
    id: 'receiptDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Receipt Date
          <ArrowUpDownIcon className="ml-2 w-4 h-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => {
      const date = getValue<string>()
      return date ? format(new Date(date), 'dd MMM yy, HH:mm') : 'N/A' // Format the date
    },
    sortingFn: 'datetime',
    enableSorting: true,
    filterFn: (row, columnId, filterValue) => {
      const raw = row.getValue(columnId) as string
      if (!raw) return false
      // Format the date as you display it
      const formatted = format(new Date(raw), 'dd MMM yy, HH:mm')
      // Case-insensitive search
      return (
        raw.toLowerCase().includes(filterValue.toLowerCase()) ||
        formatted.toLowerCase().includes(filterValue.toLowerCase())
      )
    },
  },
  {
    accessorKey: 'creditor',
    id: 'creditor',
    header: 'Creditor',
  },
  {
    accessorKey: 'remarks',
    id: 'remarks',
    header: 'Remarks',
  },
  {
    accessorKey: 'complementary',
    id: 'complementary',
    header: 'Complementary',
  },
  {
    accessorKey: 'tableNumber',
    id: 'tableNumber',
    header: 'Table Number',
  },

  {
    accessorKey: 'processedBy',
    id: 'processedBy',
    header: 'Processed By',
  },
]
