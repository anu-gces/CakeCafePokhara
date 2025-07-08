import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import CakeCafeLogo from '@/assets/Logob.png'
import { format } from 'date-fns'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { motion, AnimatePresence } from 'motion/react'
import { Receipt } from 'lucide-react'
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

export const Route = createFileRoute('/home/test')({
  component: RouteComponent,
})

// --- Exact types from billing drawer ---
interface SubcategoryOption {
  id: string
  name: string
  price: number
}
interface AddToCartItem {
  foodId: string
  foodName: string
  foodPrice: number
  qty: number
  selectedSubcategory?: SubcategoryOption
}
interface AddToCart {
  items: AddToCartItem[]
  discountRate: number
  taxRate: number
  processedBy: string
  receiptId: string
  receiptDate: string
  remarks?: string
  creditor?: string
  complementary?: boolean
}

// --- Mock data in exact shape ---
const mockBills: (AddToCart & { status?: string })[] = [
  {
    items: [
      {
        foodId: 'f1',
        foodName: 'Chocolate Cake',
        foodPrice: 400,
        qty: 2,
        selectedSubcategory: { id: 's1', name: 'Slice', price: 400 },
      },
      {
        foodId: 'f2',
        foodName: 'Coffee',
        foodPrice: 150,
        qty: 3,
      },
    ],
    discountRate: 10,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-001',
    receiptDate: '2025-07-07T10:30:00',
    remarks: 'Birthday order',
    creditor: 'John Doe',
    complementary: false,
    status: 'paid',
  },
  {
    items: [
      {
        foodId: 'f3',
        foodName: 'Donut',
        foodPrice: 100,
        qty: 1,
      },
      {
        foodId: 'f4',
        foodName: 'Latte',
        foodPrice: 200,
        qty: 2,
        selectedSubcategory: { id: 's2', name: 'Large', price: 220 },
      },
    ],
    discountRate: 0,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-002',
    receiptDate: '2025-07-06T15:45:00',
    complementary: true,
    status: 'credited',
  },
  {
    items: [
      {
        foodId: 'f5',
        foodName: 'Cheesecake',
        foodPrice: 500,
        qty: 1,
        selectedSubcategory: { id: 's3', name: 'Whole', price: 2500 },
      },
      {
        foodId: 'f6',
        foodName: 'Cappuccino',
        foodPrice: 180,
        qty: 2,
      },
    ],
    discountRate: 5,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-003',
    receiptDate: '2025-07-05T14:20:00',
    remarks: 'Special occasion',
    status: 'paid',
  },
  {
    items: [
      {
        foodId: 'f7',
        foodName: 'Croissant',
        foodPrice: 120,
        qty: 3,
      },
      {
        foodId: 'f8',
        foodName: 'Hot Chocolate',
        foodPrice: 200,
        qty: 1,
        selectedSubcategory: { id: 's4', name: 'Extra Large', price: 250 },
      },
    ],
    discountRate: 0,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-004',
    receiptDate: '2025-07-04T11:15:00',
    status: 'paid',
  },
  {
    items: [
      {
        foodId: 'f9',
        foodName: 'Muffin',
        foodPrice: 80,
        qty: 4,
      },
    ],
    discountRate: 15,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-005',
    receiptDate: '2025-07-03T16:45:00',
    creditor: 'Jane Smith',
    status: 'credited',
  },
  {
    items: [
      {
        foodId: 'f10',
        foodName: 'Black Forest Cake',
        foodPrice: 600,
        qty: 1,
        selectedSubcategory: { id: 's5', name: 'Half Kg', price: 1200 },
      },
      {
        foodId: 'f11',
        foodName: 'Espresso',
        foodPrice: 120,
        qty: 3,
      },
    ],
    discountRate: 8,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-006',
    receiptDate: '2025-07-02T13:30:00',
    remarks: 'Corporate order',
    status: 'paid',
  },
  {
    items: [
      {
        foodId: 'f12',
        foodName: 'Sandwich',
        foodPrice: 250,
        qty: 2,
      },
      {
        foodId: 'f13',
        foodName: 'Fresh Juice',
        foodPrice: 150,
        qty: 2,
        selectedSubcategory: { id: 's6', name: 'Orange', price: 150 },
      },
    ],
    discountRate: 0,
    taxRate: 13,
    processedBy: 'Alice Sharma',
    receiptId: 'R-007',
    receiptDate: '2025-07-01T09:20:00',
    complementary: true,
    status: 'credited',
  },
]

function calcSubTotal(items: AddToCartItem[]) {
  return items.reduce(
    (sum, item) =>
      sum +
      item.qty *
        (item.selectedSubcategory &&
        typeof item.selectedSubcategory.price === 'number'
          ? item.selectedSubcategory.price
          : item.foodPrice),
    0,
  )
}

function RouteComponent() {
  const [selectedBill, setSelectedBill] = useState<AddToCart | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Calculate total revenue from all bills
  const totalRevenue = mockBills.reduce((sum, bill) => {
    const subTotal = calcSubTotal(bill.items)
    const discount = subTotal * (bill.discountRate / 100)
    const tax = (subTotal - discount) * (bill.taxRate / 100)
    return sum + (subTotal - discount + tax)
  }, 0)

  return (
    <div>
      {/* Sticky Header with Total Revenue */}
      <div className="top-0 z-10 sticky bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto px-7 py-6 max-w-5xl">
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-bold text-foreground text-2xl">
              Sales Profile
            </h1>
            <div className="text-right">
              <div className="font-semibold text-foreground text-lg">
                Alice Sharma
              </div>
              <div className="text-foreground text-sm">Waiter</div>
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
              {mockBills.length} bills processed
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-5xl">
        <div className="space-y-4">
          {mockBills.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <Receipt className="opacity-50 mb-4 w-12 h-12" />
              <p>No bills found.</p>
              <p className="text-sm">Bills will appear here once processed.</p>
            </div>
          ) : (
            <AnimatePresence>
              {mockBills
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.receiptDate).getTime() -
                    new Date(a.receiptDate).getTime(),
                )
                .map((bill, i, arr) => {
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
                                  {format(
                                    new Date(bill.receiptDate),
                                    'MMM dd, yyyy',
                                  )}
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
  data: AddToCart | null
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
                            : item.foodPrice)
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
                                : item.foodPrice),
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
                                : item.foodPrice),
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
                                : item.foodPrice),
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
                                  : item.foodPrice),
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
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.foodPrice),
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
                                  : item.foodPrice),
                            0,
                          ) *
                            (data.discountRate / 100)) *
                        (1 + data.taxRate / 100)
                      ).toFixed(2)}
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
