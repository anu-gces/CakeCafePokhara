import { DataTable } from '@/components/ui/dataTable_billing'
import { createLazyFileRoute, useLoaderData } from '@tanstack/react-router'
import { columns } from '@/components/restaurant_mobile/billing'

export const Route = createLazyFileRoute('/home/billing')({
  component: () => {
    const rawOrders = useLoaderData({ from: '/home/billing' })
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
      const totalAmount = subTotalAmount - discountAmount + taxAmount

      return {
        ...order,
        subTotalAmount, // Add the total to the order object
        totalAmount,
      }
    })

    return (
      <div className="px-4">
        <h1 className="font-bold text-primary text-2xl text-left">
          Order History
        </h1>
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
      </div>
    )
  },
})
