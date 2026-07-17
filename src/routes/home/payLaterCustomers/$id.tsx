import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { SplashScreen } from '@/components/splashscreen'

export const Route = createFileRoute('/home/payLaterCustomers/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const payLaterCustomerId = id as Id<'payLaterCustomers'>

  const payLaterCustomer = useQuery(
    api.restaurant.payLaterCustomerTransactions.getPayLaterCustomerById,
    { payLaterCustomerId },
  )

  const orders = useQuery(
    api.restaurant.payLaterCustomerTransactions.listByPayLaterCustomerId,
    { payLaterCustomerId },
  )

  const markAsPaid = useMutation(
    api.restaurant.payLaterCustomerTransactions.markAsPaid,
  )

  const handleMarkAsPaid = async (orderId: Id<'orderTickets'>) => {
    try {
      await markAsPaid({ id: orderId })
      toast.success('Marked as paid')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid')
    }
  }

  if (orders === undefined || payLaterCustomer === undefined) {
    return <SplashScreen />
  }

  if (payLaterCustomer === null) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        Customer not found.
      </div>
    )
  }

  const grandTotal = orders.reduce((sum, order) => sum + order.totalAmount, 0)

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-7 py-6 max-w-xl">
          <Button
            onClick={() =>
              navigate({
                to: '/home/payLaterCustomers/payLaterCustomersAll',
                viewTransition: { types: ['slide-right'] },
              })
            }
            variant="ghost"
            className="flex items-center gap-2 mb-4 text-muted-foreground"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-base">
              Back to Pay Later Customers
            </span>
          </Button>

          <div className="flex flex-row justify-between items-center mb-3">
            <h1 className="font-bold text-primary text-2xl">
              {payLaterCustomer.name}
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
                Rs. {grandTotal.toFixed(2)}
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
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground text-sm">
            {orders.length} transactions
          </span>
        </div>

        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="py-12 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-50 mx-auto mb-4 w-12 h-12" />
              No transactions found.
            </div>
          ) : (
            orders.map((order, i) => (
              <div
                key={order._id}
                className="relative bg-card shadow-sm hover:shadow-md border border-border rounded-xl overflow-hidden transition"
              >
                {/* Timeline dot */}
                <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-white dark:border-zinc-900 rounded-full w-3 h-3" />
                {i !== orders.length - 1 && (
                  <div className="top-10 -left-[10px] absolute dark:bg-zinc-700 bg-border w-[0.5px] h-[calc(100%-2.5rem)]" />
                )}

                {/* Header */}
                <div className="flex justify-between items-start gap-2 px-4 pt-4 pb-3">
                  <div>
                    <div className="mb-0.5 text-muted-foreground text-xs">
                      KOT: <span className="font-bold">{order.kotNumber}</span>
                      {order.tableNumber !== undefined && (
                        <>
                          {' '}
                          · Table{' '}
                          <span className="font-bold">{order.tableNumber}</span>
                        </>
                      )}
                    </div>
                    <div className="font-medium text-primary text-base">
                      #{order._id.slice(-6)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center bg-purple-100 px-2 py-0.5 rounded-full font-medium text-purple-800 text-xs">
                      Pay Later
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(order.orderDate).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Order meta */}
                <div className="gap-3 grid grid-cols-3 px-4 py-3 border-border border-t">
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Type
                    </div>
                    <div className="font-medium text-foreground text-sm capitalize">
                      {order.orderType}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Payment
                    </div>
                    <div className="font-medium text-foreground text-sm capitalize">
                      {order.paymentMethod}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Subtotal
                    </div>
                    <div className="font-medium text-foreground text-sm">
                      Rs. {order.subTotal.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Discount
                    </div>
                    <div className="font-medium text-foreground text-sm">
                      Rs. {order.totalDiscount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Tax
                    </div>
                    <div className="font-medium text-foreground text-sm">
                      Rs. {order.taxAmount.toFixed(2)}
                    </div>
                  </div>
                  {order.deliveryCharge !== undefined && (
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Delivery
                      </div>
                      <div className="font-medium text-foreground text-sm">
                        Rs. {order.deliveryCharge.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-4 py-3 border-border border-t">
                  <span className="text-muted-foreground text-xs">
                    Processed by {order.processedByUser?.name ?? 'Unknown'}
                  </span>
                  <span className="font-medium text-primary text-base">
                    Rs. {order.totalAmount.toFixed(2)}
                  </span>
                </div>

                {/* Action */}
                <div className="px-4 pt-3 pb-4 border-border border-t">
                  <Button
                    className="w-full active:scale-95"
                    onClick={() => handleMarkAsPaid(order._id)}
                  >
                    Mark as Paid
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
