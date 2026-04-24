export type CartItem = {
  menuItemId: string
  name: string
  price: number
  qty: number
  type?: string
  mainCategory: string
  photoURL?: string
  currentStockCount?: number
}

export type AddToCart = {
  kotNumber: string
  items: CartItem[]
  discountAmount: number
  taxAmount: number
  tableNumber: number
  complementary: boolean
  remarks: string
  receiptDate: string // Optional manual date field
  paymentMethod: 'cash' | 'esewa' | 'bank' // Optional payment method field
  deliveryFee?: number // Optional delivery fee field
  payLaterCustomerId?: string | null // Optional pay later customer field
  status:
    | 'pending'
    | 'ready_to_serve'
    | 'ready_to_pay'
    | 'paid'
    | 'credited'
    | 'cancelled'
    | 'refunded'
  dismissed?: boolean // for notifications
}

export type ProcessedCartItem = {
  menuItemId: string
  name: string
  price: number
  qty: number
}
export type ProcessedOrder = {
  kotNumber: string
  items: ProcessedCartItem[]
  discountAmount: number
  taxAmount: number
  tableNumber: number
  complementary: boolean
  remarks: string
  receiptDate: string
  paymentMethod: 'cash' | 'esewa' | 'bank'
  deliveryFee?: number
  payLaterCustomerId?: string | null
  status:
    | 'pending'
    | 'ready_to_serve'
    | 'ready_to_pay'
    | 'paid'
    | 'credited'
    | 'cancelled'
    | 'refunded'
  dismissed?: boolean
  createdBy: string
}

export type FetchedOrder = ProcessedOrder & {
  id: string
  created: string
  expand?: {
    payLaterCustomerId?: {
      name: string
      remarks: string
    }
    createdBy?: {
      firstName: string
      lastName: string
      username: string
    }
  }
}
