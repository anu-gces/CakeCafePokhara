import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  dismissOrderNotification,
  listenToAllOrders,
  listenToKanbanCardDocument,
  updateOrderStatus,
  type ProcessedOrder,
} from '@/firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Clock,
  PackageOpenIcon,
  UtensilsIcon,
  CheckCircle2,
  HandIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react'
import type { CardType } from './ui/kanbanBoard'
import { Outlet } from '@tanstack/react-router'
import { ExpandableTabs, type TabItem } from './ui/expandable-tabs'
import { Button } from './ui/button'
import SplashScreen from './splashscreen'
import AnimatedClockIcon from '@/assets/AnimatedClockIcon'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'

const tabs: TabItem[] = [
  {
    title: 'Orders',
    icon: UtensilsIcon,
    to: '/home/notifications/orderNotification',
  },
  { type: 'separator' },
  {
    title: 'Stocks',
    icon: PackageOpenIcon,
    to: '/home/notifications/stockNotification',
  },
]

export function Notifications() {
  return (
    <div className="p-2 h-full overflow-y-auto">
      <div>
        <ExpandableTabs className="ml-3 max-w-48" tabs={tabs} />
      </div>
      <Outlet />
    </div>
  )
}

export function StockNotification() {
  const [items, setItems] = useState<CardType[] | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = listenToKanbanCardDocument((items) => {
      setItems(items)
      setError(false) // reset error if data is valid
    })

    return () => unsubscribe()
  }, [])

  const alerts = (items || []).filter(
    (item) => item.column === 'runningLow' || item.column === 'outOfStock',
  )

  if (items === null)
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center animate-pulse">
          <div className="bg-muted mb-2 rounded-full w-12 h-12"></div>
          <div className="bg-muted rounded w-32 h-4"></div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-2 w-10 h-10 text-destructive" />
        <p className="font-medium text-destructive">
          Failed to load notifications
        </p>
      </div>
    )

  if (alerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex bg-muted/30 mb-3 p-4 rounded-full">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No active alerts at the moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {alerts.map(({ id, title, displayName, updatedAt, column, category }) => (
        <div
          key={id}
          className="group relative bg-gradient-to-br from-card to-card/80 shadow-md hover:shadow-lg p-4 border rounded-xl overflow-hidden transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:to-accent/10 transition-all duration-500"></div>

          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-1 self-stretch rounded-full ${
                column === 'outOfStock' ? 'bg-rose-500' : 'bg-yellow-300'
              }`}
            />

            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold group-hover:text-primary text-base transition-colors">
                    {title}
                  </h3>
                  {/* Category Chip */}
                  <span className="inline-flex items-center bg-blue-100 px-2 py-0.5 rounded-full font-medium text-blue-600 text-xs">
                    {category}
                  </span>
                </div>
                <span className="flex items-center gap-1 bg-muted/50 ml-2 px-2 py-0.5 rounded-full text-muted-foreground text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <div className="flex items-center text-muted-foreground text-sm">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                    column === 'outOfStock'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-yellow-400/10 text-yellow-600'
                  }`}
                >
                  {column === 'outOfStock' ? 'Out of Stock' : 'Running Low'}
                </span>

                <div className="flex items-center gap-1">
                  <span className="font-medium">marked by {displayName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-0 left-0 absolute bg-gradient-to-r from-transparent via-muted/50 group-hover:via-primary/30 to-transparent w-full h-0.5 transition-all duration-300"></div>
        </div>
      ))}
    </div>
  )
}

export function OrderNotification() {
  const [orders, setOrders] = useState<
    ({ docId: string } & ProcessedOrder)[] | null
  >(null)

  const userAdditional = useFirebaseAuth().userAdditional

  useEffect(() => {
    const unsubscribe = listenToAllOrders((orders) => {
      setOrders(orders)
    })

    return () => unsubscribe()
  }, [])

  if (orders === null) {
    return <SplashScreen />
  }

  // if (error) {
  //   return (
  //     <div className="top-1/2 left-1/2 absolute text-center -translate-x-1/2 -translate-y-1/2 transform">
  //       <AlertCircle className="mx-auto mb-2 w-10 h-10 text-destructive" />
  //       <p className="font-medium text-destructive">Failed to load orders</p>
  //     </div>
  //   )
  // }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-centers">
        <div className="inline-flex bg-muted/30 mb-3 p-4 rounded-full">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No unpaid orders at the moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      <AnimatePresence mode="popLayout">
        {orders.map(
          ({
            docId,
            receiptId,
            status,
            tableNumber,
            items,
            remarks,
            receiptDate,
            creditor,
            complementary,
            dismissed,
          }) => (
            <motion.div
              key={receiptId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-card shadow-sm p-4 border rounded-xl"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <UtensilsIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    Table {tableNumber}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {status === 'pending' && (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full font-medium text-yellow-800 dark:text-yellow-300 text-xs">
                      <AnimatedClockIcon width={15} height={15} />
                      Preparing
                    </span>
                  )}
                  {status === 'ready_to_serve' && (
                    <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium text-green-800 dark:text-green-300 text-xs">
                      <CheckIcon className="w-3 h-3" />
                      Ready to Serve
                    </span>
                  )}
                  {status === 'ready_to_pay' && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full font-medium text-blue-800 dark:text-blue-300 text-xs">
                      <HandIcon className="w-3 h-3" />
                      Ready to Pay
                    </span>
                  )}
                  {status === 'paid' && (
                    <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full font-medium text-rose-800 dark:text-rose-300 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid
                    </span>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    Placed{' '}
                    {formatDistanceToNow(new Date(receiptDate), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>

              <div className="mb-1 text-muted-foreground text-sm">
                {items
                  .map((item) =>
                    item.selectedSubcategory
                      ? `${item.foodName} (${item.selectedSubcategory.name}) ×${item.qty}`
                      : `${item.foodName} ×${item.qty}`,
                  )
                  .join(', ')}
              </div>

              {remarks && (
                <div className="mb-1 text-muted-foreground text-xs italic">
                  “{remarks}”
                </div>
              )}

              {!dismissed && (
                <div className="flex gap-2 mt-2">
                  {status === 'pending' &&
                    (userAdditional?.department === 'kitchen' ||
                      userAdditional?.role === 'owner') && (
                      <Button
                        className="active:scale-95"
                        onClick={() =>
                          updateOrderStatus(docId, 'ready_to_serve', receiptId)
                        }
                      >
                        Mark as Prepared
                      </Button>
                    )}
                  {status === 'ready_to_serve' &&
                    (userAdditional?.department === 'waiter' ||
                      userAdditional?.role === 'owner') && (
                      <Button
                        className="active:scale-95"
                        onClick={() =>
                          updateOrderStatus(docId, 'ready_to_pay', receiptId)
                        }
                      >
                        Mark as Served
                      </Button>
                    )}
                  {status === 'ready_to_pay' &&
                    (userAdditional?.department === 'billing' ||
                      userAdditional?.role === 'owner') && (
                      <Button
                        className="active:scale-95"
                        onClick={() =>
                          updateOrderStatus(
                            docId,
                            creditor ? 'credited' : 'paid', // Use 'credited' if creditor exists
                            receiptId,
                          )
                        }
                      >
                        {creditor ? 'Mark as Credited' : 'Mark as Paid'}
                      </Button>
                    )}
                  {(status === 'paid' || status === 'credited') &&
                    (userAdditional?.department === 'billing' ||
                      userAdditional?.role === 'owner') && (
                      <Button
                        className="active:scale-95"
                        onClick={() =>
                          dismissOrderNotification(docId, receiptId)
                        }
                      >
                        Dismiss Notification
                      </Button>
                    )}

                  {/* Cancel button for admin, billing, and manager */}
                  {(userAdditional?.role === 'admin' ||
                    userAdditional?.role === 'owner' ||
                    (status !== 'paid' &&
                      status !== 'credited' &&
                      userAdditional?.department === 'billing')) && (
                    <Button
                      variant="outline"
                      className="active:scale-95"
                      onClick={() =>
                        updateOrderStatus(docId, 'cancelled', receiptId)
                      }
                    >
                      <XIcon className="mr-1 w-4 h-4" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              )}
              {creditor && (
                <div className="bg-muted/50 mt-2 p-2 rounded text-xs">
                  <strong>Creditor:</strong>
                  <pre className="mt-1 text-xs">
                    {JSON.stringify(creditor, null, 2)}
                  </pre>
                </div>
              )}
              {typeof complementary !== 'undefined' && complementary && (
                <div className="bg-muted/50 mt-2 p-2 rounded text-xs">
                  <strong>Complementary:</strong>
                  <pre className="mt-1 text-xs">
                    {JSON.stringify(complementary, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  )
}
