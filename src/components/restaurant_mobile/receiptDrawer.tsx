import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import CakeCafeLogo from '@/assets/Logob.webp' // Adjust path as necessary
import type { Doc } from '../../../convex/_generated/dataModel'

type ConvexOrderItem = Doc<'orderItems'>
type ConvexOrderTicket = Doc<'orderTickets'> & {
  items: ConvexOrderItem[]
}

export function ReceiptDrawer({
  data,
  receiptOpen,
  setReceiptOpen,
}: {
  data: ConvexOrderTicket | null
  receiptOpen: boolean
  setReceiptOpen: (open: boolean) => void
}) {
  if (!data) {
    return (
      <Drawer open={receiptOpen} onOpenChange={setReceiptOpen}>
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
          N/A
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Drawer open={receiptOpen} onOpenChange={setReceiptOpen}>
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
              <div>ID: {data._id}</div>
              <div>KOT: {data.kotNumber}</div>
              {data.tableNumber && <div>Table: {data.tableNumber}</div>}
              <div>
                Type: <span className="capitalize">{data.orderType}</span>
              </div>
              {format(new Date(data.orderDate), 'PPpp')}
            </div>

            <ScrollArea className="h-72 overflow-y-auto">
              <Table className="table-fixed">
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead className="text-left">Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items
                    .filter((item) => item.itemStatus !== 'cancelled')
                    .map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div>{item.name}</div>
                          {item.notes && (
                            <span className="block text-[10px] text-amber-600 italic">
                              * {item.notes}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.isComplimentary ? (
                            <span className="font-medium text-green-600">
                              Free
                            </span>
                          ) : (
                            `Rs. ${(item.quantity * item.price).toFixed(2)}`
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                  {/* Sub Total Section */}
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold text-right">
                      Sub Total
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      Rs. {data.subTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* Discount Section */}
                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Discount
                    </TableCell>
                    <TableCell className="text-red-500 text-right text-nowrap">
                      - Rs. {data.totalDiscount.toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* Tax Section */}
                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Tax
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      + Rs. {data.taxAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* Delivery Section */}
                  {data.deliveryCharge !== undefined && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-right">
                        Delivery Fee
                      </TableCell>
                      <TableCell className="text-right text-nowrap">
                        + Rs. {data.deliveryCharge.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Grand Total Footer */}
                  <TableRow>
                    <TableCell className="text-gray-500 text-xs text-left">
                      {/* Department/Added fields can handle this info post-migration */}
                      Status:{' '}
                      <span className="font-semibold capitalize">
                        {data.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-right">
                      Total
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      Rs. {data.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Dynamic Metadata Flags */}
              <div className="space-y-1 mt-4 text-xs">
                {data.payLaterCustomerId && (
                  <div>
                    <span className="font-semibold">Pay Later ID:</span>{' '}
                    {data.payLaterCustomerId}
                  </div>
                )}
                {data.items.some((i) => i.isComplimentary) && (
                  <div>
                    <span className="font-semibold text-purple-600">
                      Contains Complementary Items
                    </span>
                  </div>
                )}
              </div>
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
