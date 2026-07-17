import { create } from 'zustand'
import type { Id } from '../../../convex/_generated/dataModel'

export interface CartItem {
  itemId: Id<'menuItems'>
  name: string
  price: number
  quantity: number
  photoURL: string | null
  notes?: string
  isComplimentary: boolean
}

interface CartState {
  cart: CartItem[]
}

export const useCartStore = create<CartState>(() => ({
  cart: [],
}))

//this is lightweight of database menuItems schema
export interface AddItemProps {
  _id: Id<'menuItems'>
  name: string
  price: number
  photoURL: string | null
}

export function addItem(item: AddItemProps) {
  useCartStore.setState((state) => {
    const existing = state.cart.find((i) => i.itemId === item._id)
    if (existing) {
      return {
        cart: state.cart.map((i) =>
          i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      }
    }
    return {
      cart: [
        ...state.cart,
        {
          itemId: item._id,
          name: item.name,
          price: item.price,
          photoURL: item.photoURL,
          isComplimentary: false,
          quantity: 1,
        },
      ],
    }
  })
}

export function decrementItem(itemId: Id<'menuItems'>) {
  const existing = useCartStore.getState().cart.find((i) => i.itemId === itemId)
  if (!existing) return

  if (existing.quantity === 1) {
    return removeItem(itemId)
  }

  useCartStore.setState((state) => ({
    cart: state.cart.map((i) =>
      i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i,
    ),
  }))
}

export function removeItem(itemId: Id<'menuItems'>) {
  useCartStore.setState((state) => ({
    cart: state.cart.filter((i) => i.itemId !== itemId),
  }))
}

export function clearCart() {
  useCartStore.setState({ cart: [] })
}

export function AddNote(itemId: string, notes: string) {
  useCartStore.setState((state) => ({
    cart: state.cart.map((item) =>
      item.itemId === itemId ? { ...item, notes: notes } : item,
    ),
  }))
}

export function toggleComplimentary(itemId: Id<'menuItems'>) {
  useCartStore.setState((state) => ({
    cart: state.cart.map((item) =>
      item.itemId === itemId
        ? { ...item, isComplimentary: !item.isComplimentary }
        : item,
    ),
  }))
}
