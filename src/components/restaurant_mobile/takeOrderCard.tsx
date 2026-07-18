import { memo } from 'react'
import type { api } from '../../../convex/_generated/api'
import { addItem, useCartStore } from './takeOrderStore'
import { cn } from '@/lib/utils'
import DonutImage from '@/assets/donutImage'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '../ui/badge'

type MenuItemProps =
  (typeof api.restaurant.menuItems.listMenuItems._returnType)[number]

// Menu Item Card Component
export const MenuItemCard = memo(function MenuItemCard({
  menuItems,
}: {
  menuItems: MenuItemProps[]
}) {
  // All foods have the same type, so use the first item's type or name as the heading
  const type =
    menuItems[0]?.type?.toUpperCase() || menuItems[0]?.name.toUpperCase()

  return (
    <div className="mb-8 p-4 border rounded-xl">
      <h2 className="mb-3 font-bold text-xl tracking-wide">{type}</h2>
      <div className="flex flex-col gap-2">
        {menuItems.map((menuItem) => {
          const cartItem = useCartStore((state) =>
            state.cart.find((i) => i.itemId === menuItem._id),
          )
          const currentQty = cartItem ? cartItem.quantity : 0
          const isMaxedOut = currentQty >= menuItem.stockCount
          return (
            <div
              onClick={() => {
                // Prevent adding if stock is 0 OR if we've reached max stock limit
                if (menuItem.stockCount !== 0 && !isMaxedOut) {
                  addItem(menuItem)
                }
              }}
              key={menuItem._id}
              className={cn(
                'flex items-center gap-3 p-4 border rounded-xl transition-colors',
                menuItem.stockCount === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'active:bg-accent',
              )}
            >
              <div className="flex justify-center items-center bg-gray-100 rounded-lg w-16 h-16">
                {menuItem.photoURL ? (
                  <img
                    alt={menuItem.name}
                    src={menuItem.photoURL}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <DonutImage />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium select-none">{menuItem.name}</h3>
                <p className="text-muted-foreground text-sm">
                  Rs. {menuItem.price}
                </p>
                <p className="text-muted-foreground text-sm select-none">
                  <StockBadge
                    itemId={menuItem._id}
                    stockCount={menuItem.stockCount}
                  />
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export function StockBadge({
  itemId,
  stockCount,
}: {
  itemId: Id<'menuItems'>
  stockCount: number
}) {
  // Completely reactive selector — tracks only this item
  const cartItem = useCartStore((state) =>
    state.cart.find((item) => item.itemId === itemId),
  )

  const quantityInCart = cartItem ? cartItem.quantity : 0

  // Calculate true available stock remaining on the shelves
  const availableStock = Math.max(0, stockCount - quantityInCart)

  const dotColor =
    availableStock === 0
      ? 'bg-red-500'
      : availableStock <= 5
        ? 'bg-amber-500 animate-pulse'
        : 'bg-emerald-500'

  const label =
    availableStock === 0
      ? 'Out of stock'
      : availableStock <= 5
        ? `Only ${availableStock} left`
        : `${availableStock} available`

  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </Badge>
  )
}
