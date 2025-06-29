// Unified order/cart types for use across the POS app
import type { FoodItemProps } from '../routes/home/menuManagement'
import type { SubcategoryOption } from '../routes/home/menuManagement'

export type CartItem = Omit<FoodItemProps, 'foodPhoto'> & {
  qty: number
  selectedSubcategory?: SubcategoryOption
  finalPrice: number
  foodId: string // Ensure foodId is always string
}

export type AddToCart = {
  items: CartItem[]
  discountRate: number
  taxRate: number
  tableNumber: number
  complementary: boolean
  remarks: string
  manualRounding: number
  creditor?: string | null
  status:
    | 'pending'
    | 'ready_to_serve'
    | 'ready_to_pay'
    | 'paid'
    | 'cancelled'
    | 'dismissed'
}
