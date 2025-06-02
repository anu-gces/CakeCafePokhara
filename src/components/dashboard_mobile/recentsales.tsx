import { useLoaderData } from "@tanstack/react-router";

function calculateTotal(item: any, discountRate: number, taxRate: number): number {
  const baseTotal = item.foodPrice * item.qty;
  const discounted = baseTotal * (1 - discountRate / 100);
  const taxed = discounted * (1 + taxRate / 100);
  return Math.round(taxed);
}

export function RecentSales() {
  const rawOrder = useLoaderData({ from: "/home/dashboard" }) || [];

  return (
    <div className="space-y-6 w-full h-[400px] overflow-y-auto">
      {rawOrder.slice(0, 10).map((sale: any) => (
        <div key={sale.receiptId} className="pb-4 border-b">
          <p className="text-muted-foreground text-xs">
            {new Date(sale.receiptDate).toLocaleString()} · Processed by {sale.processedBy}
          </p>
          {sale.items.map((item: any, index: number) => (
            <div key={item.foodId + index} className="flex justify-between items-center mt-1">
              <div className="text-sm">
                <span className="font-medium">{item.foodName}</span>{" "}
                <span className="text-muted-foreground text-xs">x{item.qty}</span>
              </div>
              <div className="font-medium text-sm">NPR {calculateTotal(item, sale.discountRate, sale.taxRate)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
