import type { ProcessedOrder } from '@/firebase/firestore'
import type { KitchenLedgerItem } from '@/routes/home/kitchenLedger.lazy'
import type { BakeryLedgerItem } from '@/routes/home/bakeryLedger.lazy'

/**
 * Calculates the total amount for an order including all fees and adjustments
 * @param order - The order object containing pricing information
 * @returns The final total amount as a number
 */
export function calculateOrderTotal(order: {
  items: Array<{ foodPrice: number; qty: number }>
  discountRate: number
  taxRate: number
  manualRounding?: number
  deliveryFee?: number
}): number {
  const subtotal = calculateOrderSubtotal(order.items)
  const discount = calculateOrderDiscount(subtotal, order.discountRate)
  const tax = calculateOrderTax(subtotal - discount, order.taxRate)

  return (
    subtotal -
    discount +
    tax +
    (order.manualRounding || 0) +
    (order.deliveryFee || 0)
  )
}

/**
 * Calculates the subtotal for an order (before discounts, taxes, and fees)
 * @param items - Array of order items with price and quantity
 * @returns The subtotal amount as a number
 */
export function calculateOrderSubtotal(
  items: Array<{ foodPrice: number; qty: number }>,
): number {
  return items.reduce((sum, item) => sum + item.foodPrice * item.qty, 0)
}

/**
 * Calculates the discount amount for an order
 * @param subtotal - The order subtotal amount
 * @param discountRate - The discount rate as a percentage (0-100)
 * @returns The discount amount as a number
 */
export function calculateOrderDiscount(
  subtotal: number,
  discountRate: number,
): number {
  return subtotal * (discountRate / 100)
}

/**
 * Calculates the tax amount for an order
 * @param taxableAmount - The amount on which tax is calculated (usually subtotal - discount)
 * @param taxRate - The tax rate as a percentage (0-100)
 * @returns The tax amount as a number
 */
export function calculateOrderTax(
  taxableAmount: number,
  taxRate: number,
): number {
  return taxableAmount * (taxRate / 100)
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
 * Calculates total expenditure from ledger items, filtering by payment status
 * @param kitchenLedger - Array of kitchen ledger items
 * @param bakeryLedger - Array of bakery ledger items
 * @returns Total expenditure amount for paid items only
 */
export function calculateTotalExpenditure(
  kitchenLedger: KitchenLedgerItem[],
  bakeryLedger: BakeryLedgerItem[],
): number {
  const kitchenExpenses = kitchenLedger
    .filter((item) => item.paymentStatus === 'paid')
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  const bakeryExpenses = bakeryLedger
    .filter((item) => item.paymentStatus === 'paid')
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  return kitchenExpenses + bakeryExpenses
}
