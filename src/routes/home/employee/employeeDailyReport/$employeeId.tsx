import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, LoaderIcon, ReceiptIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { type FetchedOrder } from '@/components/restaurant_mobile/types'
import { ReceiptDrawer } from '@/components/restaurant_mobile/billing'
import { calculateOrderTotal } from '@/components/dashboard_mobile/dashboard.utils'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/lib/usePocketbaseAuth'

export const Route = createFileRoute(
  '/home/employee/employeeDailyReport/$employeeId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { employeeId } = Route.useParams()
  const [selectedBill, setSelectedBill] = useState<FetchedOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )

  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const record = await pb.collection('users').getOne<User>(employeeId)
      return record
    },
  })

  const { data: allEmployeeOrders = [], isLoading } = useQuery<FetchedOrder[]>({
    queryKey: ['employeeSales', employeeId, selectedDate],
    queryFn: async () => {
      return await pb.collection('orders').getFullList<FetchedOrder>({
        filter: `createdBy = "${employeeId}" && receiptDate >= "${format(
          selectedDate || new Date(),
          'yyyy-MM-dd',
        )}"`,
        sort: '-receiptDate',
        expand: 'payLaterCustomerId, createdBy',
      })
    },
    enabled: !!employee,
  })

  const totalRevenue = allEmployeeOrders.reduce(
    (sum, bill) => sum + calculateOrderTotal(bill),
    0,
  )
  const paidCount = allEmployeeOrders.filter((b) => b.status === 'paid').length
  const cancelledCount = allEmployeeOrders.filter(
    (b) => b.status === 'cancelled',
  ).length

  const initials = employee
    ? `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase()
    : '??'

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-4 pt-4 pb-4 max-w-xl">
          {/* Back nav */}
          <Link
            to="/home/employee/table"
            className="inline-flex items-center gap-1 mb-4 text-muted-foreground"
            viewTransition={{ types: ['slide-right'] }}
          >
            <ArrowLeft size={16} />
            <span className="text-xs">Back</span>
          </Link>

          {/* Profile + revenue card */}
          <div className="bg-white dark:bg-zinc-900 mb-3 border border-border rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage
                    src={
                      employee?.avatar
                        ? pb.files.getURL(employee, employee.avatar)
                        : undefined
                    }
                  />
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900/40 font-semibold text-violet-700 dark:text-violet-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-base truncate leading-tight">
                    {employee
                      ? `${employee.firstName} ${employee.lastName}`
                      : '...'}
                  </div>
                  <div className="text-muted-foreground text-xs capitalize">
                    {employee?.role || 'Employee'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="mb-0.5 text-[10px] text-muted-foreground">
                    today's revenue
                  </div>
                  <div className="font-semibold text-foreground text-lg leading-tight">
                    Rs. {totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 border-border border-t">
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Bills
                </div>
                <div className="font-semibold text-foreground text-lg">
                  {allEmployeeOrders.length}
                </div>
              </div>
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Paid
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400 text-lg">
                  {paidCount}
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Cancelled
                </div>
                <div className="font-semibold text-red-500 text-lg">
                  {cancelledCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-3 pb-20 max-w-xl">
        {/* Filter row */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">
              {allEmployeeOrders.length} bills · tap to view receipt
            </span>
            {isLoading && (
              <LoaderIcon className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
          <DatePickerWithPresets
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        <div className="space-y-2">
          {!isLoading && allEmployeeOrders.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-30 mb-3 w-10 h-10" />
              <p className="text-sm">No bills on this date.</p>
            </div>
          ) : (
            <AnimatePresence>
              {allEmployeeOrders.map((bill, i) => {
                const total = calculateOrderTotal(bill)
                const isCancelled = bill.status === 'cancelled'
                const itemSummary = bill.items
                  .map((item) => `${item.name} × ${item.qty}`)
                  .join(', ')

                return (
                  <motion.div
                    key={bill.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="bg-white dark:bg-zinc-900 border border-border rounded-xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => {
                      setSelectedBill(bill)
                      setDrawerOpen(true)
                    }}
                  >
                    {/* Main row */}
                    <div className="flex justify-between items-start gap-3 px-4 pt-3 pb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-[10px] text-muted-foreground">
                          KOT #{bill.kotNumber} · Table {bill.tableNumber}
                        </div>
                        <div
                          className={`text-sm font-medium leading-snug truncate ${
                            isCancelled
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          {itemSummary}
                        </div>
                        {bill.expand?.payLaterCustomerId && (
                          <div className="mt-0.5 text-[10px] text-violet-600 dark:text-violet-400">
                            Credit: {bill.expand.payLaterCustomerId.name}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                            ${
                              bill.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : bill.status === 'ready_to_serve'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : bill.status === 'ready_to_pay'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : bill.status === 'paid'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                      : bill.status === 'credited'
                                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                                        : bill.status === 'cancelled'
                                          ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                          : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {bill.status
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isCancelled
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          Rs. {total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Footer row */}
                    <div className="flex justify-between items-center px-4 py-2 border-border border-t">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(bill.receiptDate), 'hh:mm a')}
                      </span>
                      <div className="flex items-center gap-2">
                        {bill.complementary && (
                          <span className="font-medium text-[10px] text-green-600 dark:text-green-400">
                            Complementary
                          </span>
                        )}
                        {bill.remarks && (
                          <span className="max-w-[120px] text-[10px] text-muted-foreground truncate italic">
                            "{bill.remarks}"
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {bill.paymentMethod}
                        </span>
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
