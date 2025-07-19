import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ReceiptIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db, getSingleUser } from '@/firebase/firestore'
import type { ProcessedOrder } from '@/firebase/firestore'
import { ReceiptDrawer } from '@/components/restaurant_mobile/billing'
import { calculateOrderTotal } from '@/components/dashboard_mobile/dashboard.utils'

export const Route = createFileRoute(
  '/home/employee/employeeDailyReport/$employeeId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { employeeId } = Route.useParams()
  const [selectedBill, setSelectedBill] = useState<ProcessedOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dayFilter, setDayFilter] = useState<1 | 2 | 7>(7) // Default to 7 days

  // Fetch employee details
  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getSingleUser(employeeId),
  })

  // Fetch employee's sales using inline useQuery
  const { data: allEmployeeOrders = [], isLoading } = useQuery({
    queryKey: [
      'employeeSales',
      employeeId,
      employee?.firstName,
      employee?.email,
    ],
    queryFn: async (): Promise<ProcessedOrder[]> => {
      // Get employee details for filtering (firstName, displayName, email fallback)
      if (!employee) return []

      const processedByName = employee.firstName || employee.email || 'unknown'

      // Fetch from weekly order history collections
      const ordersRef = collection(db, 'orderHistoryWeekly')
      const querySnapshot = await getDocs(ordersRef)
      let allOrders: ProcessedOrder[] = []

      querySnapshot.forEach((doc) => {
        const batchOrders = (doc.data().orders || []) as ProcessedOrder[]
        allOrders = allOrders.concat(batchOrders)
      })

      // Filter by employee's processedBy name only
      return allOrders
        .filter((order) => {
          const matchesEmployee = order.processedBy === processedByName
          return matchesEmployee
        })
        .sort(
          (a, b) =>
            new Date(b.receiptDate).getTime() -
            new Date(a.receiptDate).getTime(),
        )
    },
    enabled: !!employee, // Only run query when we have employee data
  })

  // Filter orders by date range on the client side
  const employeeSales = allEmployeeOrders.filter((order) => {
    const now = new Date()
    const orderDate = new Date(order.receiptDate)

    // For "today" filter, compare dates without time
    if (dayFilter === 1) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const orderDateOnly = new Date(orderDate)
      orderDateOnly.setHours(0, 0, 0, 0)

      return orderDateOnly.getTime() === today.getTime()
    }

    // For multi-day filters, use time-based comparison
    const dateThreshold = new Date(
      now.getTime() - dayFilter * 24 * 60 * 60 * 1000,
    )

    return orderDate >= dateThreshold
  })

  // Calculate total revenue from employee's sales
  const totalRevenue = employeeSales.reduce((sum, bill) => {
    return sum + calculateOrderTotal(bill)
  }, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="text-center">
          <ReceiptIcon className="mx-auto mb-4 w-12 h-12 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
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

          {/* Filter Chips */}
          <div className="flex justify-center gap-2 mb-3">
            {([1, 2, 7] as const).map((days) => (
              <button
                key={days}
                onClick={() => setDayFilter(days)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  dayFilter === days
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {days === 1 ? 'Today' : `${days} Days`}
              </button>
            ))}
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
                <ReceiptIcon className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-600 text-sm">
                  Total Revenue
                </span>
              </div>
              <div className="font-bold text-emerald-600 text-lg">
                Rs. {totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {employeeSales.length} bills processed in{' '}
              {dayFilter === 1 ? 'today' : `last ${dayFilter} days`}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-5xl">
        <div className="space-y-4">
          {employeeSales.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-50 mb-4 w-12 h-12" />
              <p>No sales found for this employee.</p>
              <p className="text-sm">Sales will appear here once processed.</p>
            </div>
          ) : (
            <AnimatePresence>
              {employeeSales.map((bill, i, arr) => {
                const total = calculateOrderTotal(bill)
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
                                  'MMM dd, hh:mm a',
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
      {selectedBill && (
        <ReceiptDrawer
          data={selectedBill}
          receiptOpen={drawerOpen}
          setReceiptOpen={setDrawerOpen}
        />
      )}
    </div>
  )
}
