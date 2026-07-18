import { memo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  SandwichIcon,
  PizzaIcon,
  DonutIcon,
  IceCreamIcon,
  CoffeeIcon,
  BeerIcon,
  SparklesIcon,
  SearchIcon,
  ArrowLeftIcon,
  PartyPopperIcon,
  PackageIcon,
  LoaderIcon,
  HistoryIcon,
  UtensilsCrossedIcon,
} from 'lucide-react'
import DonutImage from '@/assets/donutImage'
import { SplashScreen } from '@/components/splashscreen'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import { useSearch } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

import { AnimatePresence, motion } from 'motion/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ScrollArea } from '../ui/scroll-area'

type MenuItemProps =
  (typeof api.restaurant.menuItems.listMenuItems._returnType)[number]

function CategoryTabs() {
  return (
    <>
      <div className="flex justify-center items-center pt-1 w-full">
        <ExpandableTabs
          tabs={[
            { title: 'Appetizers', icon: SandwichIcon, search: 'appetizers' },
            { title: 'Main Courses', icon: PizzaIcon, search: 'main_courses' },
            { title: 'Bakery', icon: DonutIcon, search: 'bakery' },
            { title: 'Desserts', icon: IceCreamIcon, search: 'desserts' },
            { title: 'Beverages', icon: CoffeeIcon, search: 'beverages' },
            { title: 'Hard Drinks', icon: BeerIcon, search: 'hard_drinks' },
            { title: 'Specials', icon: SparklesIcon, search: 'specials' },
            { title: 'Others', icon: PartyPopperIcon, search: 'others' },
          ]}
          to="/home/inventoryManagement"
          className="min-w-full"
        />
      </div>
    </>
  )
}

type StockStatus = {
  status: 'out' | 'low' | 'good'
  color: React.HTMLAttributes<HTMLElement>['className']
  text: string
}

const STOCK_STATUS: Record<
  'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK',
  StockStatus
> = {
  OUT_OF_STOCK: {
    status: 'out',
    color: 'bg-red-500',
    text: 'Out of Stock',
  },
  LOW_STOCK: {
    status: 'low',
    color: 'bg-yellow-500',
    text: 'Low Stock',
  },
  IN_STOCK: {
    status: 'good',
    color: 'bg-emerald-500',
    text: 'In Stock',
  },
}

const InventoryItemCard = memo(function InventoryItemCard({
  menuItems,
}: {
  menuItems: MenuItemProps[]
}) {
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return STOCK_STATUS.OUT_OF_STOCK
    }
    if (stock < 10) {
      return STOCK_STATUS.LOW_STOCK
    }
    return STOCK_STATUS.IN_STOCK
  }

  const type =
    menuItems[0]?.type?.toUpperCase() || menuItems[0]?.name.toUpperCase()

  return (
    <div className="mb-8 p-4 border rounded-xl">
      <h2 className="mb-3 font-bold text-xl tracking-wide">{type}</h2>
      <div className="flex flex-col gap-2">
        {menuItems.map((menuItem) => {
          const stockStatus = getStockStatus(menuItem.stockCount || 0)
          return (
            <div
              key={menuItem._id}
              className="flex items-center gap-3 active:bg-accent p-4 border rounded-xl transition-colors"
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{menuItem.name}</h3>
                  <div
                    className={cn('rounded-full w-2 h-2', stockStatus.color)}
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  Rs. {menuItem.price}
                </p>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span>Stock: {menuItem.stockCount ?? 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <StockAdjustmentDrawer menuItem={menuItem} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export function StockAdjustmentDrawer({
  menuItem,
}: {
  menuItem: MenuItemProps
}) {
  const [open, setOpen] = useState(false)
  const [adjustment, setAdjustment] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [reason, setReason] = useState<
    'restock' | 'sale' | 'waste' | 'correction' | 'damage'
  >('restock')

  // Hook up your updated, atomic mutation
  const adjustStock = useMutation(
    api.restaurant.menuItems.editMenuItemStockCount,
  )

  const currentStock = menuItem.stockCount ?? 0
  const newStock = currentStock + adjustment

  const handleAdjustment = async () => {
    setIsPending(true)
    try {
      await adjustStock({
        id: menuItem._id,
        stockCount: newStock,
        reasonForStockEdit: reason,
      })

      toast.success('Inventory updated & history logged')
      setAdjustment(0) // Reset input
      setOpen(false)
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Update failed'
      toast.error('Update Failed', { description: errMsg })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <PackageIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Adjust Stock - {menuItem.name}</SheetTitle>
          <SheetDescription>
            Enter the stock change amount and reason
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-4">
          {/* Stock Adjustment Section */}
          <div className="space-y-2">
            <Label htmlFor="adjustment" className="font-semibold text-base">
              Stock Adjustment
            </Label>
            <Input
              id="adjustment"
              type="number"
              placeholder="Enter positive or negative number"
              value={adjustment || ''}
              onChange={(e) => setAdjustment(Number(e.target.value))}
            />
            <div className="bg-muted/50 p-2 rounded text-sm">
              <p className="text-muted-foreground">
                Current stock:{' '}
                <span className="font-medium">{currentStock}</span>
                <br />
                New stock will be:{' '}
                <span className="font-medium">{newStock}</span>
              </p>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-semibold text-base">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(value) =>
                setReason(
                  value as
                    | 'restock'
                    | 'sale'
                    | 'waste'
                    | 'correction'
                    | 'damage',
                )
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={handleAdjustment}
            disabled={adjustment === 0 || !reason || isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" color="white" />
                Processing...
              </span>
            ) : (
              'Apply Adjustment'
            )}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function InventoryManagement() {
  const [search, setSearch] = useState('')

  // 1. Fetch live data from Convex
  const menuItems = useQuery(api.restaurant.menuItems.listMenuItems)

  const { category: selectedCategory = '' } = useSearch({
    from: '/home/inventoryManagement',
  })

  // 2. Handle Loading State (Convex returns undefined while loading)
  if (menuItems === undefined) {
    return <SplashScreen />
  }

  // Handle fallback if query returns null or empty arrays safely
  const safeMenuItems = menuItems ?? []

  return (
    <ScrollArea className="flex flex-col bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="top-0 z-50 sticky bg-transparent backdrop-blur">
        <div className="flex justify-between items-center p-4">
          <div>
            <Link
              to="/home/menuManagement"
              search={{ category: 'appetizers' }}
              viewTransition={{ types: ['slide-right'] }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-primary transition-colors"
              title="Go to Menu Management"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Go To Menu Management</span>
            </Link>
            <h1 className="font-bold text-xl">Inventory Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage your restaurant inventory and stock levels
            </p>
          </div>
          <div>
            <Link
              to="/home/inventoryHistory"
              viewTransition={{ types: ['slide-left'] }}
              className="inline-flex items-center gap-1 hover:bg-muted px-3 py-2 rounded-md text-muted-foreground hover:text-primary transition-colors"
              title="View Inventory History"
            >
              <HistoryIcon className="w-4 h-4" />
              <span className="font-medium text-sm">History</span>
            </Link>
          </div>
        </div>

        <CategoryTabs />
        <div className="top-[48px] z-10 sticky py-2">
          <SearchIcon className="top-1/2 left-4 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-x-0 rounded-none"
          />
        </div>
        {search !== '' && (
          <p className="mb-2 ml-4 text-gray-500 text-xs italic">
            Showing results across all categories
          </p>
        )}
      </div>

      {/* Inventory Items List */}
      <div className="pb-32">
        <div className="space-y-0 p-4">
          <AnimatePresence>
            {Object.values(
              safeMenuItems
                .filter((menuItem) => {
                  if (search.trim()) {
                    const searchLower = search.toLowerCase()
                    const inName = menuItem.name
                      .toLowerCase()
                      .includes(searchLower)
                    const inCategory = menuItem.mainCategory
                      .toLowerCase()
                      .includes(searchLower)
                    return inName || inCategory
                  } else {
                    return (
                      selectedCategory === '' ||
                      menuItem.mainCategory === selectedCategory
                    )
                  }
                })
                .reduce<Record<string, typeof safeMenuItems>>(
                  (acc, menuItem) => {
                    const groupKey =
                      menuItem.type ?? menuItem.name.toLowerCase()
                    if (!acc[groupKey]) acc[groupKey] = []
                    acc[groupKey].push(menuItem)
                    return acc
                  },
                  {},
                ),
            ).map((menuItemsOfType) => (
              <motion.div
                key={`${menuItemsOfType[0].type ?? menuItemsOfType[0].name}-${menuItemsOfType.length}`}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <InventoryItemCard menuItems={menuItemsOfType} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty Search State */}
        {safeMenuItems.filter((menuItem) => {
          if (!search.trim()) return false
          const searchLower = search.toLowerCase()
          const inName = menuItem.name.toLowerCase().includes(searchLower)
          const inCategory = menuItem.mainCategory
            .toLowerCase()
            .includes(searchLower)

          return inName || inCategory
        }).length === 0 &&
          search.trim() !== '' && (
            <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
              <div className="mb-2 text-4xl">
                <UtensilsCrossedIcon />
              </div>
              <span className="text-sm">No items match your search</span>
              <span className="mt-1 text-[10px] tiny:text-xs">
                Try a different search term or add a new item using the + button
              </span>
            </div>
          )}
      </div>
    </ScrollArea>
  )
}
