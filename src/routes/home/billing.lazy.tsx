import { DataTable } from '@/components/ui/dataTable_billing'
import { createLazyFileRoute, useLoaderData } from '@tanstack/react-router'
import { columns } from '@/components/restaurant_mobile/billing'

export const Route = createLazyFileRoute('/home/billing')({
  component: () => {
    const rawOrders = useLoaderData({ from: '/home/billing' })

    const orders = rawOrders.map((order) => {
      const subTotalAmount = order.items.reduce(
        (sum, item) => sum + item.foodPrice * item.qty,
        0,
      )
      const discountAmount = subTotalAmount * (order.discountRate / 100)
      const taxAmount =
        (subTotalAmount - discountAmount) * (order.taxRate / 100)
      const totalAmount = subTotalAmount - discountAmount + taxAmount

      return {
        ...order,
        subTotalAmount, // Add the total to the order object
        totalAmount,
      }
    })

    return (
      <>
        <DataTable
          columns={columns}
          data={orders || []}
          filterColumnId="receiptDate"
          visibleColumns={[
            'receiptId',
            'totalAmount',
            'receiptDate',
            'processedBy',
          ]}
        />
      </>
    )
  },
})
