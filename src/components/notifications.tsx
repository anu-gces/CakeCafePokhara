import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './ui/drawer'

import { useEffect, useState } from 'react'
import { ReceiptDrawer } from './restaurant_mobile/billing'
import { motion, AnimatePresence } from 'motion/react'
import {
  dismissOrderNotification,
  listenToAllOrders,
  updateOrderStatus,
  type ProcessedOrder,
} from '@/firebase/takeOrder'
import { listenToKanbanCardDocument } from '@/firebase/firestore'
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
  LoaderIcon,
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
  // All hooks at the top, always called in the same order
  const [orders, setOrders] = useState<
    ({ docId: string } & ProcessedOrder)[] | null
  >(null)
  const [cancelDrawer, setCancelDrawer] = useState<{
    open: boolean
    docId?: string
    receiptId?: string
  }>({ open: false })
  const [cancelLoading, setCancelLoading] = useState(false)
  const [receiptDrawer, setReceiptDrawer] = useState<{
    open: boolean
    order?: { docId: string } & ProcessedOrder
  }>({ open: false })
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
        {orders.map((order) => {
          const {
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
          } = order
          return (
            <motion.div
              key={receiptId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="group bg-card shadow-sm p-4 border rounded-xl cursor-pointer"
              onClick={() => setReceiptDrawer({ open: true, order })}
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
                {items.map((item) => `${item.name} ×${item.qty}`).join(', ')}
              </div>

              {remarks && (
                <div className="mb-1 text-muted-foreground text-xs italic">
                  “{remarks}”
                </div>
              )}

              {/* Tap for details label */}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-muted-foreground group-hover:text-primary text-xs transition-colors select-none">
                  Tap for details
                </span>
              </div>

              {!dismissed && (
                <div
                  className="flex gap-2 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
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
                        onClick={async () => {
                          if (creditor) {
                            // Just mark as credited, no daily balance update
                            await updateOrderStatus(
                              docId,
                              'credited',
                              receiptId,
                            )
                          } else {
                            // Mark as paid AND update daily balance for cash orders
                            await updateOrderStatus(docId, 'paid', receiptId)

                            // Update daily balance only for non-complementary cash orders
                            if (
                              !order.complementary &&
                              order.paymentMethod === 'cash'
                            ) {
                              const { runTransaction } = await import(
                                'firebase/firestore'
                              )
                              const { db } = await import(
                                '@/firebase/firestore'
                              )
                              const { updateDailyBalanceTransaction } =
                                await import('@/firebase/dailyBalances')

                              // Calculate order total
                              const orderTotal =
                                order.items.reduce((total, item) => {
                                  return total + item.price * item.qty
                                }, 0) -
                                order.discountAmount +
                                order.taxAmount +
                                (order.deliveryFee || 0)

                              // Update daily balance in a separate transaction
                              await runTransaction(db, async (transaction) => {
                                // Extract just the date part from receiptDate
                                const dateOnly = new Date(order.receiptDate)
                                  .toISOString()
                                  .split('T')[0]

                                await updateDailyBalanceTransaction(
                                  transaction,
                                  dateOnly, // Use dateOnly instead of order.receiptDate
                                  orderTotal, // income
                                  0, // expenses
                                )
                              })
                            }
                          }
                        }}
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
                        Clear Notification
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
                        setCancelDrawer({ open: true, docId, receiptId })
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
          )
        })}
      </AnimatePresence>
      {/* Cancel Order Confirmation Drawer */}
      <CancelOrderDrawer
        open={cancelDrawer.open}
        onOpenChange={(open) => setCancelDrawer((prev) => ({ ...prev, open }))}
        onConfirm={async () => {
          if (!cancelDrawer.docId || !cancelDrawer.receiptId) return
          setCancelLoading(true)
          try {
            // Find the order object by receiptId
            const order = orders?.find(
              (o) => o.receiptId === cancelDrawer.receiptId,
            )
            if (!order) throw new Error('Order not found')

            const { runTransaction, doc } = await import('firebase/firestore')
            const { db } = await import('@/firebase/firestore')
            const { getDailyDocId } = await import('@/firebase/firestore.utils')

            await runTransaction(db, async (transaction) => {
              // --- READS FIRST ---
              // Get inventory
              const inventoryRef = doc(db, 'menu', 'allFoodItems')
              const inventorySnap = await transaction.get(inventoryRef)
              let foodItems = inventorySnap.exists()
                ? inventorySnap.data().foodItems || []
                : []

              // Get order batch
              const orderBatchRef = doc(
                db,
                'orderHistoryDaily',
                cancelDrawer.docId!,
              )
              const orderBatchSnap = await transaction.get(orderBatchRef)
              let ordersArr = orderBatchSnap.exists()
                ? orderBatchSnap.data().orders || []
                : []

              // Get inventory history batch
              const inventoryHistoryDocId = getDailyDocId(new Date())
              const inventoryHistoryBatchRef = doc(
                db,
                'inventoryHistoryDaily',
                inventoryHistoryDocId,
              )
              const inventoryHistorySnap = await transaction.get(
                inventoryHistoryBatchRef,
              )
              let historyBatches = inventoryHistorySnap.exists()
                ? inventoryHistorySnap.data().items || []
                : []

              // --- PROCESS DATA ---
              // Restore inventory for each item
              const batchHistoryItems = []
              for (const cartItem of order.items) {
                const itemIndex = foodItems.findIndex(
                  (item: any) => item.foodId === cartItem.foodId,
                )
                if (itemIndex === -1) continue

                const oldItem = foodItems[itemIndex]
                const newStock = (oldItem.currentStockCount || 0) + cartItem.qty

                const updatedItem = {
                  ...oldItem,
                  lastStockCount: oldItem.currentStockCount,
                  currentStockCount: newStock,
                  reasonForStockEdit: 'cancelled',
                  editedStockBy: order.processedBy,
                  dateModified: new Date().toISOString(),
                }

                foodItems[itemIndex] = updatedItem

                // Log inventory history (Omit fields)
                batchHistoryItems.push({
                  foodId: updatedItem.foodId,
                  name: updatedItem.name,
                  currentStockCount: updatedItem.currentStockCount,
                  lastStockCount: updatedItem.lastStockCount,
                  reasonForStockEdit: updatedItem.reasonForStockEdit,
                  dateModified: updatedItem.dateModified,
                  editedStockBy: updatedItem.editedStockBy,
                })
              }

              // Update order status
              ordersArr = ordersArr.map((o: any) =>
                o.receiptId === cancelDrawer.receiptId
                  ? {
                      ...o,
                      status: 'cancelled',
                      updatedAt: new Date().toISOString(),
                    }
                  : o,
              )

              // --- WRITES AFTER ALL READS ---
              transaction.set(inventoryRef, { foodItems }, { merge: true })
              transaction.set(
                orderBatchRef,
                { orders: ordersArr },
                { merge: true },
              )
              // Write batch history as a single InventoryHistoryProps object
              if (batchHistoryItems.length > 0) {
                historyBatches.push({
                  historyId: crypto.randomUUID(),
                  foodItems: batchHistoryItems,
                })
              }
              transaction.set(
                inventoryHistoryBatchRef,
                { items: historyBatches },
                { merge: true },
              )
            })

            setCancelDrawer({ open: false })
          } finally {
            setCancelLoading(false)
          }
        }}
        loading={cancelLoading}
      />
      {/* Receipt Drawer for order details */}
      {receiptDrawer.order && (
        <ReceiptDrawer
          data={receiptDrawer.order}
          receiptOpen={receiptDrawer.open}
          setReceiptOpen={(open: boolean) =>
            setReceiptDrawer((prev) => ({ ...prev, open }))
          }
        />
      )}
    </div>
  )
}

function CancelOrderDrawer({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading?: boolean
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Cancel Order?</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to cancel this order? This action cannot be
            undone.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <LoaderIcon
                  color="white"
                  className="inline-block mr-2 w-4 h-4 align-middle animate-spin"
                />
                Deleting...
              </>
            ) : (
              'Yes, Cancel Order'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">No, Go Back</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
