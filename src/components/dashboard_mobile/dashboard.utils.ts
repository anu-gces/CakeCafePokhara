import type { ProcessedOrder } from '@/firebase/takeOrder'
import type { KitchenLedgerItem } from '@/firebase/kitchenLedger'
import type { BakeryLedgerItem } from '@/firebase/bakeryLedger'

/**
 * Calculates the total amount for an order including all fees and adjustments
 * @param order - The order object containing pricing information
 * @returns The final total amount as a number
 */
export function calculateOrderTotal(order: {
  items: Array<{
    price: number
    qty: number
  }>
  discountAmount: number
  taxAmount: number
  deliveryFee?: number
}): number {
  const subtotal = calculateOrderSubtotal(order.items)

  const total =
    subtotal - order.discountAmount + order.taxAmount + (order.deliveryFee || 0)

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(total * 100) / 100
}

/**
 * Calculates the subtotal for an order (before discounts, taxes, and fees)
 * @param items - Array of order items with price, quantity
 * @returns The subtotal amount as a number
 */
export function calculateOrderSubtotal(
  items: Array<{
    price: number
    qty: number
  }>,
): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

/**
 * Calculates the total revenue from an array of orders
 * @param orders - Array of processed orders
 * @returns The total revenue as a number
 */
export function calculateTotalRevenue(orders: ProcessedOrder[]): number {
  return orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0)
}

/**
 * Calculates the average order value from an array of orders
 * @param orders - Array of processed orders
 * @returns The average order value as a number (0 if no orders)
 */
export function calculateAverageOrderValue(orders: ProcessedOrder[]): number {
  if (orders.length === 0) return 0
  return calculateTotalRevenue(orders) / orders.length
}

/**
 * Calculates total expenditure from ledger items
 * @param kitchenLedger - Array of kitchen ledger items
 * @param bakeryLedger - Array of bakery ledger items
 * @returns Total expenditure amount for all items
 */
export function calculateTotalExpenditure(
  kitchenLedger: KitchenLedgerItem[],
  bakeryLedger: BakeryLedgerItem[],
): number {
  const kitchenExpenses = kitchenLedger.reduce(
    (sum, item) => sum + item.price,
    0,
  )

  const bakeryExpenses = bakeryLedger.reduce((sum, item) => sum + item.price, 0)

  return kitchenExpenses + bakeryExpenses
}
