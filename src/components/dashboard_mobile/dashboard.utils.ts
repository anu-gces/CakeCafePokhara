import type { FetchedOrder } from '../restaurant_mobile/types'
import type { ExpenseLedger } from '@/routes/home/expenseLedger/$department'

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
export function calculateTotalRevenue(orders: FetchedOrder[]): number {
  return orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0)
}

/**
 * Calculates the average order value from an array of orders
 * @param orders - Array of processed orders
 * @returns The average order value as a number (0 if no orders)
 */
export function calculateAverageOrderValue(orders: FetchedOrder[]): number {
  if (orders.length === 0) return 0
  return calculateTotalRevenue(orders) / orders.length
}

/**
 * Calculates total expenditure from ledger items
 * @param expenseLedger - Array of expense ledger items
 * @returns Total expenditure amount for all items
 */
export function calculateTotalExpenditure(
  expenseLedger: ExpenseLedger[],
): number {
  return expenseLedger.reduce((sum, item) => {
    const price = item.price ?? 0
    const qty = item.quantity ?? 0

    return sum + price * qty
  }, 0)
}
