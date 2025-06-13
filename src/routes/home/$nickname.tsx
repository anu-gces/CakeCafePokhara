import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AddToCart } from '@/components/restaurant_mobile/editMenu'
import { getCreditorOrdersByNickname } from '@/firebase/firestore'
import SplashScreen from '@/components/splashscreen'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

function getTotal(
  items: AddToCart['items'],
  discountRate: number,
  taxRate: number,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.qty * item.foodPrice,
    0,
  )
  const discount = subtotal * (discountRate / 100)
  const taxed = (subtotal - discount) * (taxRate / 100)
  return Math.round(subtotal - discount + taxed)
}

export const Route = createFileRoute('/home/$nickname')({
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
    <div className="mx-auto px-6 py-6 pb-9 max-w-xl min-h-full">
      <Button
        onClick={() =>
          navigate({
            to: '/home/creditors',
            viewTransition: { types: ['slide-right'] },
          })
        }
        variant="ghost"
        className="flex items-center gap-2 mb-4 text-muted-foreground"
      >
        <ArrowLeft size={20} />
        <span className="font-medium text-base">Back to Creditors</span>
      </Button>

      <h1 className="mb-6 font-bold text-primary text-2xl">
        Transactions for {nickname}
      </h1>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-muted-foreground text-center">
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

              {i === orders.length - 1 && (
                <>
                  <div className="top-10 -left-[10px] absolute flex items-end bg-transparent dark:bg-transparent dark:border-zinc-700 border-b border-l rounded-bl-2xl w-[calc(100%-12rem)] h-[calc(100%-1.5rem)]"></div>
                  <span className="right-0 -bottom-8 absolute px-2 py-1 rounded font-bold text-primary">
                    Grand Total: Rs.{' '}
                    {orders.reduce(
                      (sum, o) =>
                        sum + getTotal(o.items, o.discountRate, o.taxRate),
                      0,
                    )}
                  </span>
                </>
              )}

              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-primary text-lg">
                  #{order.receiptId}
                </div>
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
                      {item.foodName}{' '}
                      <span className="text-muted-foreground">
                        × {item.qty}
                      </span>
                    </span>
                    <span className="font-medium">
                      Rs. {item.foodPrice * item.qty}
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
              <div className="flex justify-end items-center mt-2">
                <span className="font-bold text-primary text-base">
                  Total:{' '}
                  <span className="ml-1">
                    Rs.{' '}
                    {getTotal(order.items, order.discountRate, order.taxRate)}
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
