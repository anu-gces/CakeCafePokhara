import type { ProcessedOrder } from '@/firebase/takeOrder'

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
                <span className="font-medium">{item.name}</span>{' '}
                <span className="text-muted-foreground text-xs">
                  x{item.qty}
                </span>
              </div>
              <div className="font-medium text-sm">
                NPR {(item.price * item.qty).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
