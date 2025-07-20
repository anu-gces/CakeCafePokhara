import type { ProcessedOrder } from '@/firebase/firestore'

function calculateTotal(
  item: ProcessedOrder['items'][0],
  discountRate: number,
  taxRate: number,
): number {
  // Use subcategory price if available, otherwise fall back to finalPrice
  const basePrice =
    item.selectedSubcategory &&
    typeof item.selectedSubcategory.price === 'number'
      ? item.selectedSubcategory.price
      : item.finalPrice

  const baseTotal = basePrice * item.qty
  const discounted = baseTotal * (1 - discountRate / 100)
  const taxed = discounted * (1 + taxRate / 100)
  return Math.round(taxed)
}

export function RecentSales({ income }: { income: ProcessedOrder[] }) {
  return (
    <div className="space-y-6 w-full h-[400px] overflow-y-auto">
      {income.slice(0, 10).map((sale: ProcessedOrder) => (
        <div key={sale.receiptId} className="pb-4 border-b">
          <p className="text-muted-foreground text-xs">
            {new Date(sale.receiptDate).toLocaleString()} · Processed by{' '}
            {sale.processedBy}
          </p>
          {sale.items.map((item, index) => (
            <div
              key={item.foodId || `item-${index}`}
              className="flex justify-between items-center mt-1"
            >
              <div className="text-sm">
                <span className="font-medium">{item.foodName}</span>{' '}
                <span className="text-muted-foreground text-xs">
                  x{item.qty}
                </span>
              </div>
              <div className="font-medium text-sm">
                NPR {calculateTotal(item, sale.discountRate, sale.taxRate)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
