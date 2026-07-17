import { format } from 'date-fns'
import CakeCafeLogo from '@/assets/Logob.webp'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { withForm } from './takeOrderForm'
import { useCartStore } from './takeOrderStore'
import { useQuery } from 'convex/react'
import { InlineLoader } from '../splashscreen'
import { PrinterIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { api } from '../../../convex/_generated/api'
import type { FunctionArgs } from 'convex/server'
import type { Id } from '../../../convex/_generated/dataModel'

type OrderMeta = FunctionArgs<
  typeof api.restaurant.orderTickets.createOrderTicket
>

const defaultOrderMetaValues: OrderMeta = {
  branchId: '' as Id<'branches'>,
  payLaterCustomerId: '' as Id<'payLaterCustomers'>,
  kotNumber: '',
  tableNumber: undefined,
  deliveryCharge: 0,
  orderType: 'dine-in',
  totalDiscount: 0,
  taxAmount: 0,
  orderDate: Date.now(),
  status: 'active',
  items: [],
}

export const ReceiptPreview = withForm({
  defaultValues: defaultOrderMetaValues,
  render: ({ form }) => {
    const cart = useCartStore((state) => state.cart)

    // Form Field Metadata
    const kotNumber = form.getFieldValue('kotNumber')
    const tableNumber = form.getFieldValue('tableNumber')
    const orderType = form.getFieldValue('orderType')
    const deliveryCharge = form.getFieldValue('deliveryCharge') ?? 0
    const totalDiscount = form.getFieldValue('totalDiscount') ?? 0
    const taxAmount = form.getFieldValue('taxAmount') ?? 0
    const payLaterCustomerId = form.getFieldValue('payLaterCustomerId')
    const orderDate = form.getFieldValue('orderDate')

    // 👇 FIXED: Correctly evaluate complimentary items at the subtotal accumulation layer
    const subtotal = cart.reduce((acc, item) => {
      const actualPrice = item.isComplimentary ? 0 : item.price
      return acc + actualPrice * item.quantity
    }, 0)

    const grandTotal = Math.max(
      0,
      subtotal + taxAmount + deliveryCharge - totalDiscount,
    )

    const currentUser = useQuery(api.users.currentUser)

    if (!currentUser) {
      return (
        <div className="h-72">
          <InlineLoader />
        </div>
      )
    }

    return (
      <div className="mx-auto w-full print:max-w-[280px] font-mono print:text-[11px] text-xs">
        <div className="bg-white dark:bg-black p-2 border border-border rounded-xl">
          {/* Brand Header Block */}
          <div className="flex flex-col items-center gap-3 p-1 text-center">
            <div className="flex items-center gap-3 text-left">
              <img
                src={CakeCafeLogo}
                width="40"
                height="40"
                alt="Company Logo"
                className="rounded-md"
              />
              <div className="gap-0.5 grid">
                <h3 className="font-bold text-lg leading-none">
                  Cake Cafe<sup className="text-[10px]">TM</sup>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  Jwalakhel-8, Pokhara
                  <br />
                  Phone: +061-531234
                </p>
              </div>
            </div>
          </div>

          <hr className="my-2 border-border" />

          {/* Receipt Meta Details */}
          <h2 className="mb-1 font-bold text-xs text-center uppercase tracking-wider">
            Receipt
          </h2>
          <div className="space-y-0.5 mb-3 text-[11px] text-muted-foreground text-center">
            <div>
              Type:{' '}
              <span className="font-medium text-foreground uppercase">
                {orderType || 'N/A'}
              </span>
            </div>
            <div>
              Table:{' '}
              <span className="font-medium text-foreground">
                {tableNumber !== undefined ? tableNumber : 'N/A'}
              </span>
            </div>
            <div>
              KOT:{' '}
              <span className="font-medium text-foreground">
                {kotNumber || 'N/A'}
              </span>
            </div>
            <div>
              Processed By:{' '}
              <span className="font-medium text-foreground uppercase">
                {currentUser.name || 'N/A'}
              </span>
            </div>
            <div>
              {orderDate
                ? format(new Date(orderDate), 'PPpp')
                : format(new Date(), 'PPpp')}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pr-1">
            <Table className="w-full text-[11px] table-fixed">
              <TableHeader className="border-b-2">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="p-1 w-[55%] h-7 text-left">
                    Item
                  </TableHead>
                  <TableHead className="p-1 w-[15%] h-7 text-center">
                    Qty
                  </TableHead>
                  <TableHead className="p-1 w-[30%] h-7 text-right">
                    Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow
                    key={item.itemId}
                    className="hover:bg-transparent border-b/50"
                  >
                    <TableCell className="p-1 break-words align-top leading-tight">
                      <div>
                        {item.name}{' '}
                        {item.isComplimentary && (
                          <span className="font-bold text-[10px] text-green-600">
                            [COMP]
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="opacity-75 mt-0.5 text-[9px] text-muted-foreground italic leading-none">
                          * {item.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="p-1 text-center align-top">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="p-1 text-right text-nowrap align-top">
                      Rs.{' '}
                      {(item.isComplimentary
                        ? 0
                        : item.quantity * item.price
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Sub Total */}
                <TableRow className="hover:bg-transparent border-t">
                  <TableCell colSpan={2} className="p-1 font-medium text-right">
                    Sub Total
                  </TableCell>
                  <TableCell className="p-1 font-semibold text-right">
                    Rs. {subtotal.toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* Discount */}
                {totalDiscount > 0 && (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell
                      colSpan={2}
                      className="p-1 text-muted-foreground text-right"
                    >
                      Discount
                    </TableCell>
                    <TableCell className="p-1 font-medium text-red-600 text-right text-nowrap">
                      - Rs. {Number(totalDiscount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}

                {/* Tax */}
                {taxAmount > 0 && (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell
                      colSpan={2}
                      className="p-1 text-muted-foreground text-right"
                    >
                      Tax
                    </TableCell>
                    <TableCell className="p-1 text-right text-nowrap">
                      + Rs. {Number(taxAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}

                {/* Delivery Fee */}
                {deliveryCharge > 0 && (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell
                      colSpan={2}
                      className="p-1 text-muted-foreground text-right"
                    >
                      Delivery Fee
                    </TableCell>
                    <TableCell className="p-1 text-right text-nowrap">
                      + Rs. {Number(deliveryCharge).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}

                {/* Grand Total */}
                <TableRow className="hover:bg-transparent border-t-2 border-double font-bold text-sm">
                  <TableCell
                    colSpan={2}
                    className="p-1 font-bold text-xs text-right"
                  >
                    Total
                  </TableCell>
                  <TableCell className="p-1 font-bold text-xs text-right text-nowrap">
                    Rs. {grandTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Custom Account Meta Info Container */}
            {payLaterCustomerId && (
              <div className="space-y-0.5 mt-3 pt-2 border-t border-dashed text-[10px] text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">
                    Pay Later Customer:
                  </span>{' '}
                  <span className="font-mono break-all">
                    {payLaterCustomerId}
                  </span>
                </div>
              </div>
            )}
          </div>

          <hr className="my-3 border-dashed" />

          <div className="print:hidden flex justify-center">
            <Button
              type="button"
              size="sm"
              className="flex justify-center items-center gap-2 w-full h-8 text-xs"
              onClick={() => {
                const fullInvoicePayload = {
                  metadata: {
                    kotNumber,
                    tableNumber,
                    orderType,
                    payLaterCustomerId,
                    orderDate,
                  },
                  totals: {
                    subtotal,
                    totalDiscount,
                    taxAmount,
                    deliveryCharge,
                    grandTotal,
                  },
                  items: cart,
                }
                console.log(
                  'Sending structured payload to device output pipeline:',
                  fullInvoicePayload,
                )
                window.print()
              }}
            >
              <PrinterIcon className="stroke-white w-3.5 h-3.5 shrink-0" />{' '}
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    )
  },
})
