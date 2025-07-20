import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AddToCart } from '../takeOrder'
import {
  getCreditorOrdersByNickname,
  updateOrderStatus,
} from '@/firebase/firestore'
import SplashScreen from '@/components/splashscreen'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { motion } from 'motion/react'

function getTotal(
  items: AddToCart['items'],
  discountRate: number,
  taxRate: number,
  manualRounding: number,
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      item.qty *
        (item.selectedSubcategory &&
        typeof item.selectedSubcategory.price === 'number'
          ? item.selectedSubcategory.price
          : item.foodPrice),
    0,
  )
  const discount = subtotal * (discountRate / 100)
  const taxed = (subtotal - discount) * (taxRate / 100)
  return Math.round(subtotal - discount + taxed + manualRounding)
}

export const Route = createFileRoute('/home/creditors/$nickname')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { nickname } = Route.useParams()

  // Filter orders for this nickname
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ordersByNickName', nickname],
    queryFn: () => getCreditorOrdersByNickname(nickname),
    enabled: !!nickname,
  })

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center">
        <SplashScreen />
      </div>
    )
  }
  if (error) {
    return (
      <div className="text-red-500 text-center">
        Error loading transactions: {error.message}
      </div>
    )
  }

  return (
    <div>
      {/* Sticky Header with Grand Total */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b 5">
        <div className="mx-auto px-7 py-6 max-w-xl">
          <Button
            onClick={() =>
              navigate({
                to: '/home/creditors/creditorsAll',
                viewTransition: { types: ['slide-right'] },
              })
            }
            variant="ghost"
            className="flex items-center gap-2 mb-4 text-muted-foreground"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-base">Back to Creditors</span>
          </Button>
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-bold text-primary text-2xl">
              Transactions for {nickname}
            </h1>
          </div>
          {/* Grand Total Card */}
          <motion.div
            className="hover:bg-white/30 dark:hover:bg-zinc-800/30 bg-gradient-to-r from-primary/10 dark:from-primary/20 to-primary/5 dark:to-primary/10 hover:shadow-lg hover:backdrop-blur-md p-3 border border-primary/20 hover:border-primary/40 dark:hover:border-zinc-600 rounded-lg transition-all duration-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Grand Total
                </span>
              </div>
              <div className="font-bold text-primary text-lg">
                Rs.{' '}
                {orders.reduce(
                  (sum, o) =>
                    sum +
                    getTotal(
                      o.items,
                      o.discountRate,
                      o.taxRate,
                      o.manualRounding,
                    ),
                  0,
                )}
              </div>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {orders.length} transactions • Last updated{' '}
              {new Date().toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-xl">
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="py-12 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-50 mx-auto mb-4 w-12 h-12" />
              No transactions found.
            </div>
          ) : (
            orders.map((order, i) => (
              <div
                key={order.receiptId}
                className="relative bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg px-6 py-5 border border-primary/10 dark:border-zinc-700 rounded-xl transition"
              >
                {/* Timeline dot */}
                <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-white dark:border-zinc-900 rounded-full w-3 h-3" />
                {/* Timeline line */}
                {i !== orders.length - 1 && (
                  <div className="top-10 -left-[10px] absolute dark:bg-zinc-700 bg-border w-[0.5px] h-[calc(100%-2.5rem)]" />
                )}

                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-primary text-lg">
                    #{order.receiptId}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        ${
          order.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : order.status === 'ready_to_serve'
              ? 'bg-green-100 text-green-800'
              : order.status === 'ready_to_pay'
                ? 'bg-blue-100 text-blue-800'
                : order.status === 'paid'
                  ? 'bg-rose-100 text-rose-800'
                  : order.status === 'credited'
                    ? 'bg-purple-100 text-purple-800'
                    : order.status === 'cancelled'
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-muted text-muted-foreground'
        }
      `}
                  >
                    {order.status
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <div className="text-muted-foreground text-xs">
                    <Badge variant="outline">
                      {format(
                        new Date(order.receiptDate),
                        'dd MMM yyyy, hh:mm a',
                      )}
                    </Badge>
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span className="truncate">
                        {item.foodName}
                        {item.selectedSubcategory ? (
                          <span className="ml-1 text-primary/80 text-xs">
                            ({item.selectedSubcategory.name})
                          </span>
                        ) : null}
                        <span className="text-muted-foreground">
                          {' '}
                          × {item.qty}
                        </span>
                      </span>
                      <span className="font-medium">
                        Rs.{' '}
                        {(
                          item.qty *
                          (item.selectedSubcategory &&
                          typeof item.selectedSubcategory.price === 'number'
                            ? item.selectedSubcategory.price
                            : item.foodPrice)
                        ).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-muted-foreground text-xs">
                  <span>
                    Discount:{' '}
                    <span className="font-semibold">{order.discountRate}%</span>
                  </span>
                  <span>
                    Tax: <span className="font-semibold">{order.taxRate}%</span>
                  </span>
                  <span>
                    Table:{' '}
                    <span className="font-semibold">{order.tableNumber}</span>
                  </span>
                  <span>
                    Rounding:{' '}
                    <span className="font-semibold">
                      {order.manualRounding >= 0 ? '+' : '-'} Rs.{' '}
                      {Math.abs(order.manualRounding)}
                    </span>
                  </span>
                  {order.complementary && (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Complementary
                    </span>
                  )}
                </div>
                {order.remarks && (
                  <div className="mb-1 text-muted-foreground text-xs italic">
                    {order.remarks}
                  </div>
                )}
                <div className="mb-1 text-muted-foreground text-xs">
                  Processed by:{' '}
                  <span className="font-semibold">{order.processedBy}</span>
                </div>

                <div className="flex justify-end items-center gap-2 mt-2">
                  {order.status === 'credited' && (
                    <div className="flex justify-end mt-2">
                      <Button
                        className="active:scale-95"
                        onClick={async () => {
                          // You may want to show a loader/toast here
                          await updateOrderStatus(
                            order.docId,
                            'paid',
                            order.receiptId,
                          )
                        }}
                      >
                        Mark as Paid
                      </Button>
                    </div>
                  )}
                  <span className="font-bold text-primary text-base">
                    Total:{' '}
                    <span className="ml-1">
                      Rs.{' '}
                      {getTotal(
                        order.items,
                        order.discountRate,
                        order.taxRate,
                        order.manualRounding,
                      )}
                    </span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
