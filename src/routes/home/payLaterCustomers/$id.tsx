import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, LoaderIcon, ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { pb } from '@/lib/pocketbase'
import type { FetchedOrder } from '@/components/restaurant_mobile/types'
import { toast } from 'sonner'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useState } from 'react'

export const Route = createFileRoute('/home/payLaterCustomers/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<FetchedOrder[]>({
    queryKey: ['ordersById', id, selectedDate],
    queryFn: async () => {
      const date = selectedDate ?? new Date()
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      return await pb.collection('orders').getFullList({
        filter: `
          payLaterCustomerId="${id}" &&
          created >= "${start.toISOString()}" &&
          created <= "${end.toISOString()}"
        `,
        sort: '-created',
        expand: 'createdBy, payLaterCustomerId',
      })
    },
    enabled: !!id,
  })

  const { data: payLaterCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      return await pb.collection('payLaterCustomers').getOne(id)
    },
    enabled: !!id,
  })

  const queryClient = useQueryClient()
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await pb.collection('orders').update(id, {
        status,
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ordersById', id],
      })
      toast.success('Marked as paid!')
    },

    onError: () => {
      toast.error('Failed to update order.')
    },
  })

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
              {payLaterCustomer?.name || 'Customer Transactions'}
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
                {orders
                  .filter((order) => order.status !== 'paid')
                  .reduce((sum, order) => {
                    const itemsTotal = order.items.reduce(
                      (itemSum, item) =>
                        itemSum + (item.price ?? 0) * (item.qty ?? 0),
                      0,
                    )

                    const discount = order.discountAmount ?? 0
                    const tax = order.taxAmount ?? 0
                    const delivery = order.deliveryFee ?? 0

                    return sum + itemsTotal - discount + tax + delivery
                  }, 0)
                  .toFixed(2)}
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
        {/* Filter row */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {orders.length} transactions
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

        {error && (
          <div className="py-4 text-red-500 text-sm text-center">
            Error loading transactions: {(error as Error).message}
          </div>
        )}

        <div className="space-y-6">
          {!isLoading && orders.length === 0 ? (
            <div className="py-12 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-50 mx-auto mb-4 w-12 h-12" />
              No transactions found.
            </div>
          ) : (
            orders.map((order, i) => (
              <div
                key={order.id}
                className="relative bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border border-border rounded-xl overflow-hidden transition"
              >
                {/* Timeline dot */}
                <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-white dark:border-zinc-900 rounded-full w-3 h-3" />
                {/* Timeline line */}
                {i !== orders.length - 1 && (
                  <div className="top-10 -left-[10px] absolute dark:bg-zinc-700 bg-border w-[0.5px] h-[calc(100%-2.5rem)]" />
                )}

                {/* Header */}
                <div className="flex justify-between items-start gap-2 px-4 pt-4 pb-3">
                  <div>
                    <div className="mb-0.5 text-muted-foreground text-xs">
                      KOT: <span className="font-bold">{order.kotNumber}</span>{' '}
                      · Table{' '}
                      <span className="font-bold">{order.tableNumber}</span>
                    </div>
                    <div className="font-medium text-primary text-base">
                      #{order.id}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
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
                        }`}
                    >
                      {order.status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {format(
                        new Date(order.receiptDate),
                        'dd MMM yyyy, hh:mm a',
                      )}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1 px-4 py-3 border-border border-t">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-muted-foreground text-sm"
                    >
                      <span>
                        {item.name}
                        <span className="text-muted-foreground">
                          {' '}
                          × {item.qty}
                        </span>
                      </span>
                      <span className="font-medium">
                        Rs. {(item.qty * (item.price ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Adjustments */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-3 border-border border-t">
                  <span className="text-muted-foreground text-xs">
                    Discount:{' '}
                    <span className="text-foreground">
                      Rs. {order.discountAmount ?? 0}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Tax:{' '}
                    <span className="text-foreground">
                      Rs. {order.taxAmount ?? 0}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Delivery:{' '}
                    <span className="text-foreground">
                      Rs. {order.deliveryFee ?? 0}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Table:{' '}
                    <span className="text-foreground">{order.tableNumber}</span>
                  </span>
                  {order.complementary && (
                    <span className="font-medium text-green-600 dark:text-green-400 text-xs">
                      Complementary
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-4 py-3 border-border border-t">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      By {order.expand?.createdBy?.firstName}{' '}
                      {order.expand?.createdBy?.lastName}
                    </div>
                    {order.remarks && (
                      <div className="mt-0.5 text-muted-foreground text-xs italic">
                        "{order.remarks}"
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-primary text-base">
                    Rs.{' '}
                    {(
                      order.items.reduce(
                        (s, i) => s + (i.price ?? 0) * (i.qty ?? 0),
                        0,
                      ) -
                      (order.discountAmount ?? 0) +
                      (order.taxAmount ?? 0) +
                      (order.deliveryFee ?? 0)
                    ).toFixed(2)}
                  </span>
                </div>

                {/* Action */}
                {order.status === 'credited' && (
                  <div className="px-4 pt-3 pb-4 border-border border-t">
                    <Button
                      className="w-full active:scale-95"
                      onClick={() =>
                        updateOrderStatusMutation.mutate({
                          id: order.id,
                          status: 'paid',
                        })
                      }
                    >
                      Mark as Paid
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
