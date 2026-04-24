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
import { motion, AnimatePresence } from 'motion/react'

import { formatDistanceToNow } from 'date-fns'
import {
  Clock,
  UtensilsIcon,
  CheckCircle2,
  HandIcon,
  CheckIcon,
  XIcon,
  LoaderIcon,
} from 'lucide-react'
import { Outlet } from '@tanstack/react-router'
import { Button } from './ui/button'
import SplashScreen from './splashscreen'
import AnimatedClockIcon from '@/assets/AnimatedClockIcon'
import { usePocketbaseAuth } from '@/lib/usePocketbaseAuth'
import { pb } from '@/lib/pocketbase'
import type { FetchedOrder } from './restaurant_mobile/types'
import { ReceiptDrawer } from './restaurant_mobile/billing'

export function Notifications() {
  return (
    <div className="p-2 h-full overflow-y-auto">
      <Outlet />
    </div>
  )
}

export function OrderNotification() {
  const [orders, setOrders] = useState<FetchedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelDrawer, setCancelDrawer] = useState<{
    open: boolean
    id?: string
  }>({ open: false })
  const [cancelLoading, setCancelLoading] = useState(false)
  const [receiptDrawer, setReceiptDrawer] = useState<{
    open: boolean
    order?: FetchedOrder
  }>({ open: false })
  const { user } = usePocketbaseAuth()

  // Helper: Update Status
  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await pb.collection('orders').update(id, { status })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  // Helper: Dismiss Notification
  const dismissOrderNotification = async (id: string) => {
    try {
      await pb.collection('orders').update(id, { dismissed: true })
    } catch (err) {
      console.error('Failed to dismiss:', err)
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const records = await pb
          .collection('orders')
          .getFullList<FetchedOrder>({
            sort: '-created',
            filter: 'dismissed = false',
            expand: 'payLaterCustomerId, createdBy',
          })
        setOrders(records)
      } catch (err) {
        console.error('Initial fetch failed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()

    pb.collection('orders').subscribe<FetchedOrder>('*', (e) => {
      setOrders((current) => {
        if (e.action === 'create') return [e.record, ...current]
        if (e.action === 'update') {
          if (e.record.dismissed)
            return current.filter((item) => item.id !== e.record.id)
          return current.map((item) =>
            item.id === e.record.id ? e.record : item,
          )
        }
        if (e.action === 'delete')
          return current.filter((item) => item.id !== e.record.id)
        return current
      })
    })

    return () => {
      pb.collection('orders').unsubscribe('*')
    }
  }, [])

  if (isLoading) return <SplashScreen />

  if (orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
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
            id,
            kotNumber,
            status,
            tableNumber,
            items,
            remarks,
            receiptDate,
            payLaterCustomerId,
            complementary,
          } = order
          return (
            <motion.div
              key={id}
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
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium text-sm">
                      KOT: {kotNumber}
                    </span>
                    <span className="font-medium text-sm">
                      Table {tableNumber}
                    </span>
                  </div>
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

              {complementary && (
                <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 mb-1 px-2 py-0.5 rounded-full font-medium text-purple-800 dark:text-purple-300 text-xs">
                  Complementary
                </span>
              )}

              {remarks && (
                <div className="mb-1 text-muted-foreground text-xs italic">
                  “{remarks}”
                </div>
              )}

              <div className="flex items-center gap-1 mt-1">
                <span className="text-muted-foreground group-hover:text-primary text-xs transition-colors select-none">
                  Tap for details
                </span>
              </div>

              <div
                className="flex gap-2 mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Workflow progression buttons */}
                {status === 'pending' &&
                  (user.department === 'kitchen' || user.role === 'owner') && (
                    <Button
                      className="active:scale-95"
                      onClick={() => updateOrderStatus(id, 'ready_to_serve')}
                    >
                      Mark as Prepared
                    </Button>
                  )}

                {status === 'ready_to_serve' &&
                  (user.department === 'waiter' || user.role === 'owner') && (
                    <Button
                      className="active:scale-95"
                      onClick={() => updateOrderStatus(id, 'ready_to_pay')}
                    >
                      Mark as Served
                    </Button>
                  )}

                {status === 'ready_to_pay' &&
                  (user.department === 'operations' ||
                    user.role === 'owner') && (
                    <Button
                      className="active:scale-95"
                      onClick={async () => {
                        if (payLaterCustomerId) {
                          await updateOrderStatus(id, 'credited')
                        } else {
                          await updateOrderStatus(id, 'paid')
                          if (
                            !order.complementary &&
                            order.paymentMethod === 'cash'
                          ) {
                            const orderTotal =
                              order.items.reduce(
                                (t, i) => t + i.price * i.qty,
                                0,
                              ) -
                              order.discountAmount +
                              order.taxAmount +
                              (order.deliveryFee || 0)
                            const dateOnly = new Date(order.receiptDate)
                              .toISOString()
                              .split('T')[0]
                            await pb.collection('daily_balances').create({
                              date: dateOnly,
                              income: orderTotal,
                              expenses: 0,
                              orderId: id,
                            })
                          }
                        }
                      }}
                    >
                      {payLaterCustomerId ? 'Mark as Credited' : 'Mark as Paid'}
                    </Button>
                  )}

                {/* Cancel button - only for active/in-progress orders */}
                {(status === 'pending' ||
                  status === 'ready_to_serve' ||
                  status === 'ready_to_pay') &&
                  (user.role === 'manager' ||
                    user.role === 'owner' ||
                    user.department === 'operations') && (
                    <Button
                      variant="outline"
                      className="active:scale-95"
                      onClick={() => setCancelDrawer({ open: true, id })}
                    >
                      <XIcon className="mr-1 w-4 h-4" />
                      Cancel Order
                    </Button>
                  )}

                {/* Clear notification - terminal states */}
                {(status === 'paid' ||
                  status === 'credited' ||
                  status === 'cancelled' ||
                  status === 'refunded') &&
                  (user.department === 'operations' ||
                    user.role === 'owner' ||
                    user.role === 'manager') && (
                    <Button
                      className="active:scale-95"
                      onClick={() => dismissOrderNotification(id)}
                    >
                      Clear Notification
                    </Button>
                  )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <CancelOrderDrawer
        open={cancelDrawer.open}
        onOpenChange={(open) => setCancelDrawer((prev) => ({ ...prev, open }))}
        onConfirm={async () => {
          if (!cancelDrawer.id) return
          setCancelLoading(true)
          try {
            const order = orders?.find((o) => o.id === cancelDrawer.id)
            if (!order) throw new Error('Order not found')

            // // Restore Inventory Logic
            // for (const cartItem of order.items) {
            //   const foodItem = await pb
            //     .collection('menuItems')
            //     .getOne(cartItem.menuItemId, { expand: 'menuItemId' })
            //   const newStock = (foodItem.currentStockCount || 0) + cartItem.qty

            //   await pb.collection('menuItems').update(cartItem.menuItemId, {
            //     currentStockCount: newStock,
            //     lastStockCount: foodItem.currentStockCount,
            //     reasonForStockEdit: 'cancelled',
            //     editedStockBy: user.id,
            //   })
            // }

            await pb
              .collection('orders')
              .update(cancelDrawer.id, { status: 'cancelled' })
            setCancelDrawer({ open: false })
          } catch (err) {
            console.error('Cancellation failed:', err)
          } finally {
            setCancelLoading(false)
          }
        }}
        loading={cancelLoading}
      />

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
                <LoaderIcon className="inline-block mr-2 w-4 h-4 animate-spin" />{' '}
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
