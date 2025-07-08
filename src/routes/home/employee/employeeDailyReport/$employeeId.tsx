import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import CakeCafeLogo from '@/assets/Logob.png'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { motion, AnimatePresence } from 'motion/react'
import { Receipt, ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db, getSingleUser } from '@/firebase/firestore'
import type { ProcessedOrder } from '@/firebase/firestore'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute(
  '/home/employee/employeeDailyReport/$employeeId',
)({
  component: RouteComponent,
})

function calcSubTotal(items: ProcessedOrder['items']) {
  return items.reduce(
    (sum, item) =>
      sum +
      item.qty *
        (item.selectedSubcategory &&
        typeof item.selectedSubcategory.price === 'number'
          ? item.selectedSubcategory.price
          : item.finalPrice),
    0,
  )
}

function RouteComponent() {
  const { employeeId } = Route.useParams()
  const [selectedBill, setSelectedBill] = useState<ProcessedOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Get today's date range
  const today = new Date()
  const startDate = startOfDay(today).toISOString()
  const endDate = endOfDay(today).toISOString()

  // Fetch employee details
  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getSingleUser(employeeId),
  })

  // Fetch employee's sales for today using inline useQuery
  const { data: employeeSales = [], isLoading } = useQuery({
    queryKey: ['employeeSales', employeeId, startDate, endDate],
    queryFn: async (): Promise<ProcessedOrder[]> => {
      // Fetch from weekly order history collections
      const ordersRef = collection(db, 'orderHistoryWeekly')
      const querySnapshot = await getDocs(ordersRef)
      let allOrders: ProcessedOrder[] = []

      querySnapshot.forEach((doc) => {
        const batchOrders = (doc.data().orders || []) as ProcessedOrder[]
        allOrders = allOrders.concat(batchOrders)
      })

      // Filter by employee ID and today's date
      return allOrders
        .filter((order) => {
          const orderDate = new Date(order.receiptDate)
          const orderDateStr = orderDate.toISOString()
          return (
            order.processedBy === employeeId &&
            orderDateStr >= startDate &&
            orderDateStr <= endDate
          )
        })
        .sort(
          (a, b) =>
            new Date(b.receiptDate).getTime() -
            new Date(a.receiptDate).getTime(),
        )
    },
  })

  // Calculate total revenue from employee's sales today
  const totalRevenue = employeeSales.reduce((sum, bill) => {
    const subTotal = calcSubTotal(bill.items)
    const discount = subTotal * (bill.discountRate / 100)
    const tax = (subTotal - discount) * (bill.taxRate / 100)
    return sum + (subTotal - discount + tax)
  }, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="text-center">
          <Receipt className="mx-auto mb-4 w-12 h-12 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sticky Header with Total Revenue */}
      <div className="top-0 z-10 sticky bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto px-7 py-6 max-w-5xl">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Link
                to="/home/employee/table"
                className="flex justify-center items-center bg-muted hover:bg-muted/80 rounded-full w-8 h-8 transition-colors"
                viewTransition={{ types: ['slide-right'] }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="font-bold text-foreground text-2xl">
                Sales Profile
              </h1>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground text-lg">
                {employee
                  ? `${employee.firstName} ${employee.lastName}`
                  : 'Loading...'}
              </div>
              <div className="text-foreground text-sm">
                {employee?.role || 'Employee'}
              </div>
            </div>
          </div>
          {/* Total Revenue Card */}
          <motion.div
            className="hover:bg-emerald-500/10 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 hover:shadow-lg hover:backdrop-blur-md p-3 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg transition-all duration-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-600 text-sm">
                  Total Revenue
                </span>
              </div>
              <div className="font-bold text-emerald-600 text-lg">
                Rs. {totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {employeeSales.length} bills processed today
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-5xl">
        <div className="space-y-4">
          {employeeSales.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <Receipt className="opacity-50 mb-4 w-12 h-12" />
              <p>No sales found for today.</p>
              <p className="text-sm">Sales will appear here once processed.</p>
            </div>
          ) : (
            <AnimatePresence>
              {employeeSales.map((bill, i, arr) => {
                const subTotal = calcSubTotal(bill.items)
                const discount = subTotal * (bill.discountRate / 100)
                const tax = (subTotal - discount) * (bill.taxRate / 100)
                const total = subTotal - discount + tax
                return (
                  <motion.div
                    key={bill.receiptId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="relative"
                  >
                    <div
                      className="relative bg-card shadow-sm hover:shadow-md px-6 py-5 border border-border rounded-xl transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedBill(bill)
                        setDrawerOpen(true)
                      }}
                    >
                      {/* Timeline dot */}
                      <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-card rounded-full w-3 h-3" />
                      {/* Timeline line */}
                      {i !== arr.length - 1 && (
                        <div className="top-10 -left-[10px] absolute bg-border w-[1px] h-[calc(100%-2.5rem)]" />
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-primary text-base">
                              {bill.receiptId}
                            </h3>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600 text-lg">
                                Rs. {total.toFixed(2)}
                              </div>
                              {bill.complementary && (
                                <span className="inline-block bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full text-green-800 dark:text-green-300 text-xs">
                                  Complementary
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Bill details */}
                          <div className="gap-2 grid grid-cols-2 mb-2 text-muted-foreground text-xs">
                            <span>
                              Items:{' '}
                              <span className="font-medium">
                                {bill.items.length}
                              </span>
                            </span>
                            <span className="col-span-1 text-right">
                              <span className="font-medium">
                                {format(new Date(bill.receiptDate), 'hh:mm a')}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
      <ReceiptDrawer
        data={selectedBill}
        receiptOpen={drawerOpen}
        setReceiptOpen={setDrawerOpen}
      />
    </div>
  )
}

function ReceiptDrawer({
  data,
  receiptOpen,
  setReceiptOpen,
}: {
  data: ProcessedOrder | null
  receiptOpen: boolean
  setReceiptOpen: (open: boolean) => void
}) {
  if (!data) return null
  const subTotal = calcSubTotal(data.items)
  const discount = subTotal * (data.discountRate / 100)
  const tax = (subTotal - discount) * (data.taxRate / 100)
  const total = subTotal - discount + tax
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
                      <TableCell>
                        {item.foodName}
                        {item.selectedSubcategory &&
                          item.selectedSubcategory.name && (
                            <span className="ml-1 text-muted-foreground text-xs">
                              &mdash; {item.selectedSubcategory.name}
                            </span>
                          )}
                      </TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-right">
                        Rs.
                        {(
                          item.qty *
                          (item.selectedSubcategory &&
                          typeof item.selectedSubcategory.price === 'number'
                            ? item.selectedSubcategory.price
                            : item.finalPrice)
                        ).toFixed(2)}
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
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.finalPrice),
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
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.finalPrice),
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
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.finalPrice),
                          0,
                        ) -
                          data.items.reduce(
                            (sum, item) =>
                              sum +
                              item.qty *
                                (item.selectedSubcategory &&
                                typeof item.selectedSubcategory.price ===
                                  'number'
                                  ? item.selectedSubcategory.price
                                  : item.finalPrice),
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
                      Rs.{total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {/* Order Meta Info below Processed By */}
              <div className="space-y-1 mt-4 text-xs">
                {data.remarks && (
                  <div>
                    <span className="font-semibold">Remarks:</span>{' '}
                    {data.remarks}
                  </div>
                )}
                {data.creditor && (
                  <div>
                    <span className="font-semibold">Creditor:</span>{' '}
                    {data.creditor}
                  </div>
                )}
                {data.complementary && (
                  <div>
                    <span className="font-semibold text-green-600">
                      Complementary
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
