import { DataTable } from '@/components/ui/dataTable_billing'
import { createLazyFileRoute } from '@tanstack/react-router'
import { columns } from '@/components/restaurant_mobile/billing'
import {
  calculateOrderTotal,
  calculateOrderSubtotal,
} from '@/components/dashboard_mobile/dashboard.utils'
import { getAllOrders, type ProcessedOrder } from '@/firebase/firestore'
import { useQuery } from '@tanstack/react-query'

export const Route = createLazyFileRoute('/home/billing')({
  component: () => {
    const { data: rawOrders = [] } = useQuery<ProcessedOrder[]>({
      queryKey: ['getAllOrders'],
      queryFn: getAllOrders,
      placeholderData: [],
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY,
    })

    const filteredOrders = rawOrders.filter(
      (order) => order.status === 'paid' || order.status === 'credited',
    )

    const orders = filteredOrders.map((order) => {
      const subTotalAmount = calculateOrderSubtotal(order.items)
      const totalAmount = calculateOrderTotal(order)

      return {
        ...order,
        subTotalAmount,
        totalAmount,
      }
    })

    // const multipliedOrders = Array.from({ length: 100 }, (_, multiplier) =>
    //   orders.map((order) => ({
    //     ...order,
    //     receiptId: `${order.receiptId}-${multiplier}`, // Unique receipt ID
    //     kotNumber: `${order.kotNumber}-${multiplier}`, // Unique KOT number
    //   })),
    // ).flat()

    return (
      <div className="flex flex-col px-4 h-full">
        <h1 className="font-bold text-primary text-2xl text-left">
          Order History
        </h1>
        <DataTable
          columns={columns}
          data={orders || []}
          filterColumnId="kotNumber"
          visibleColumns={[
            'actions',
            'kotNumber',
            'totalAmount',
            'receiptDate',
            'paymentMethod',
          ]}
        />
      </div>
    )
  },
})
