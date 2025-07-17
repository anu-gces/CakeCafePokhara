import { DataTable } from '@/components/ui/dataTable_billing'
import { createLazyFileRoute } from '@tanstack/react-router'
import { columns } from '@/components/restaurant_mobile/billing'
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
      const subTotalAmount = order.items.reduce(
        (sum, item) =>
          sum +
          item.qty *
            (item.selectedSubcategory &&
            typeof item.selectedSubcategory.price === 'number'
              ? item.selectedSubcategory.price
              : item.foodPrice),
        0,
      )
      const discountAmount = subTotalAmount * (order.discountRate / 100)
      const taxAmount =
        (subTotalAmount - discountAmount) * (order.taxRate / 100)
      const totalAmount =
        subTotalAmount -
        discountAmount +
        taxAmount +
        (order.manualRounding || 0)

      return {
        ...order,
        subTotalAmount, // Add the total to the order object
        totalAmount,
      }
    })

    return (
      <div className="flex flex-col px-4 h-full overflow-y-clip">
        <h1 className="font-bold text-primary text-2xl text-left">
          Order History
        </h1>
        <DataTable
          columns={columns}
          data={orders || []}
          filterColumnId="receiptDate"
          // visibleColumns={[
          //   'receiptId',
          //   'totalAmount',
          //   'receiptDate',
          //   'processedBy',
          // ]}
        />
      </div>
    )
  },
})
