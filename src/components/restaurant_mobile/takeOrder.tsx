import { useState } from 'react'
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  PlusIcon,
  LoaderIcon,
  SandwichIcon,
  PizzaIcon,
  DonutIcon,
  IceCreamIcon,
  CoffeeIcon,
  BeerIcon,
  SparklesIcon,
  UtensilsCrossedIcon,
  SearchIcon,
  PartyPopperIcon,
  PackageIcon,
  ShoppingCartIcon,
  RotateCcwIcon,
  MinusIcon,
  ShoppingBagIcon,
  SquarePenIcon,
  AlertCircleIcon,
} from 'lucide-react'

import DonutImage from '@/assets/donutImage'
import { SplashScreen } from '@/components/splashscreen'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import { useSearch } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../../convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import Stepper, { Step } from '@/components/Stepper'
import {
  addItem,
  AddNote,
  clearCart,
  decrementItem,
  toggleComplimentary,
  useCartStore,
} from './takeOrderStore'
import { z } from 'zod'
import { DatePickerWithPresets } from '../ui/datepicker'
import { cn } from '@/lib/utils'
import type { FunctionArgs } from 'convex/server'
import type { Id } from '../../../convex/_generated/dataModel'
import { useAppForm, withForm } from './takeOrderForm'
import { useStore } from '@tanstack/react-form'
import { ReceiptPreview } from './receiptPreview'
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'
import { MenuItemCard } from './takeOrderCard'
import { ScrollArea } from '../ui/scroll-area'

type MenuItemProps =
  (typeof api.restaurant.menuItems.listMenuItems._returnType)[number]

export const MAIN_CATEGORIES = [
  'appetizers',
  'main_courses',
  'bakery',
  'desserts',
  'beverages',
  'hard_drinks',
  'specials',
  'others',
] as const

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
          to="/home/menuManagement"
          className="min-w-full"
        />
      </div>
    </>
  )
}

// Main Take Order Component
export function TakeOrder() {
  const menuItems = useQuery(api.restaurant.menuItems.listMenuItems)
  const currentUser = useQuery(api.users.currentUser)
  // const user = useQuery(api.users.currentUser)

  const { category: selectedCategory } = useSearch({
    from: '/home/takeOrder',
  })

  const [search, setSearch] = useState('')

  if (menuItems === undefined) {
    return <SplashScreen />
  }

  return (
    <div className="flex flex-col bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="top-0 z-50 sticky bg-transparent backdrop-blur">
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="font-bold text-xl">Take Order</h1>
            <p className="text-muted-foreground text-sm">
              Create Orders from here
            </p>
          </div>
          <div className="flex sm:flex-row flex-col items-center gap-2">
            <AddToCartDrawer />
            <Button
              onClick={() => {
                clearCart()
              }}
              variant={'outline'}
              className="flex gap-2"
            >
              <RotateCcwIcon />
              Clear Cart
            </Button>
            <Link
              to="/home/inventoryManagement"
              search={{ category: 'appetizers' }}
              viewTransition={{ types: ['slide-left'] }}
              className="inline-flex items-center gap-1 p-2 border rounded-lg text-muted-foreground hover:text-primary transition-colors"
              title="Go to Inventory"
            >
              <PackageIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Go To Inventory</span>
            </Link>
            {(currentUser?.role === 'manager' ||
              currentUser?.role === 'owner') && (
              <Link
                to="/home/menuManagement"
                search={{ category: 'appetizers' }}
                viewTransition={{ types: ['slide-left'] }}
                className="inline-flex items-center gap-1 p-2 border rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title="Go to Edit Menu"
              >
                <SquarePenIcon className="w-5 h-5" />
                <span className="font-medium text-sm">Edit Menu</span>
              </Link>
            )}
          </div>
        </div>

        <CategoryTabs />
        <div className="top-[48px] z-10 sticky py-2">
          <SearchIcon className="top-1/2 left-4 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-x-0 rounded-none"
          />
        </div>
        {search !== '' && (
          <p className="mb-2 ml-4 text-gray-500 text-sm italic">
            Showing results across all categories
          </p>
        )}
      </div>

      {/* Menu Items List */}
      <div className="pb-32">
        <div className="px-4">
          <AnimatePresence>
            {Object.values(
              menuItems
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
                .reduce<Record<string, MenuItemProps[]>>((acc, menuItem) => {
                  const groupKey = menuItem.type ?? menuItem.name.toLowerCase()
                  if (!acc[groupKey]) acc[groupKey] = []
                  acc[groupKey].push(menuItem)
                  return acc
                }, {}),
            ).map((menuItemsOfType) => (
              <motion.div
                key={menuItemsOfType[0].type ?? menuItemsOfType[0].name}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <MenuItemCard menuItems={menuItemsOfType} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {menuItems.filter((menuItem) => {
          if (!search.trim()) return false // Only show empty state if search is active and no results
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
              <span className="mt-1 text-[10px] tiny:text-sm">
                Try a different search term or add a new item using the + button
              </span>
            </div>
          )}
      </div>
    </div>
  )
}

type OrderMeta = FunctionArgs<
  typeof api.restaurant.orderTickets.createOrderTicket
>

const defaultOrderMetaValues: OrderMeta = {
  branchId: '' as Id<'branches'>,
  payLaterCustomerId: '' as Id<'payLaterCustomers'>,
  kotNumber: '',
  tableNumber: undefined,
  deliveryCharge: 0,
  orderType: 'dine-in',
  totalDiscount: 0,
  taxAmount: 0,
  orderDate: Date.now(),
  status: 'active',
  paymentMethod: 'cash',
  items: [],
}

const orderMetaSchema = z.object({
  branchId: z.string().min(1, 'Please select a branch') as any,
  payLaterCustomerId: z.string().optional() as any,
  kotNumber: z.string().min(1, 'KOT number is required'),
  tableNumber: z.number().optional(),
  deliveryCharge: z.number().min(0),
  orderType: z.enum(['dine-in', 'takeaway', 'delivery']),
  totalDiscount: z.number().min(0),
  taxAmount: z.number().min(0),
  orderDate: z.number(),
  status: z.enum(['active', 'paid', 'cancelled']),
  paymentMethod: z.enum(['cash', 'esewa', 'bank']),
  items: z.array(
    z.object({
      itemId: z.string() as any,
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      isComplimentary: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
})

export function AddToCartDrawer() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const menuItems = useQuery(api.restaurant.menuItems.listMenuItems)
  const cart = useCartStore((state) => state.cart)
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0)
  const createOrderTicket = useMutation(
    api.restaurant.orderTickets.createOrderTicket,
  )

  const form = useAppForm({
    defaultValues: defaultOrderMetaValues,
    validators: {
      onSubmit: orderMetaSchema,
      onChange: orderMetaSchema,
      onMount: orderMetaSchema,
    },
    onSubmit: async ({ value }) => {
      // Clean up cart items,remove photoURL and stuff
      const cleanItems = cart.map((cartItem) => ({
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        isComplimentary: cartItem.isComplimentary,
        notes: cartItem.notes || undefined, // Convert blank/null text fields cleanly to undefined
      }))

      // Clear out empty optional metadata strings
      const finalPayload = {
        ...value,
        items: cleanItems,

        // Convert empty string relations or undefined tokens
        payLaterCustomerId:
          value.payLaterCustomerId !== ''
            ? value.payLaterCustomerId
            : undefined,
        tableNumber:
          value.tableNumber !== undefined ? value.tableNumber : undefined,
        deliveryCharge:
          value.deliveryCharge !== undefined ? value.deliveryCharge : undefined,
      }

      try {
        const response = await createOrderTicket(finalPayload)
        console.log('Ticket successfully created in Convex with ID:', response)

        toast.success('Order Created Successfully!', {
          description: `Ticket ID: ${response}`,
        })

        setOpen(false)
        clearCart()
        form.reset()
      } catch (error: any) {
        toast.error('Failed to Create Order', {
          description:
            error instanceof ConvexError
              ? typeof error.data === 'string'
                ? error.data
                : error.data?.message
              : 'Unknown error',
        })
      }
    },
  })

  const isFormValid = useStore(form.store, (state) => state.canSubmit)

  // Stepwise Validation
  let shouldDisableNext = false

  if (currentStep === 1) {
    const isCartEmpty = cart.length === 0
    const hasOversoldItem = cart.some((cartItem) => {
      const dbItem = menuItems?.find((item) => item._id === cartItem.itemId)
      return !dbItem || cartItem.quantity > dbItem.stockCount
    })
    shouldDisableNext = isCartEmpty || hasOversoldItem
  }

  if (currentStep === 2) {
    shouldDisableNext = !isFormValid
  }
  // ------------------------------------------

  return (
    <Drawer shouldScaleBackground open={open} onOpenChange={setOpen} modal>
      <DrawerTrigger asChild className="relative">
        <Button variant="outline" className="flex items-center gap-2">
          {totalCount > 0 && (
            <span className="-top-2 -right-2 absolute flex justify-center items-center bg-primary shadow-sm p-1 rounded-full min-w-5 h-5 font-bold tabular-nums text-[10px] text-primary-foreground antialiased select-none">
              {totalCount}
            </span>
          )}

          <ShoppingCartIcon className="w-5 h-5" />
          <span className="font-medium text-sm">Cart</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[95svh]">
        <div className="flex flex-col h-full overflow-hidden">
          <Stepper
            initialStep={1}
            onStepChange={(step) => setCurrentStep(step)}
            onFinalStepCompleted={async () => {
              form.handleSubmit()
            }}
            backButtonText="Previous"
            nextButtonText="Next"
            nextButtonProps={{
              disabled: shouldDisableNext,
              className: cn(
                'flex flex-row gap-2 bg-primary px-2 py-1 rounded-md text-white transition-colors duration-200', // base styles if needed
                shouldDisableNext
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'active:scale-[0.98]',
              ),
            }}
            className="flex flex-col flex-1 mx-auto w-full max-w-6xl h-full min-h-0"
            stepCircleContainerClassName="w-full max-w-none shadow-none"
            contentClassName="flex-1 min-h-0"
          >
            {/* STEP 1: BASKET MANAGEMENT */}
            <Step>
              <div className="py-2 animate-in duration-200 fade-in-50">
                <h3 className="font-semibold text-lg">Review Basket Items</h3>
                <StepBasket />
              </div>
            </Step>

            {/* STEP 2: METADATA & ORDER TYPE */}
            <Step>
              <div className="py-2 h-full animate-in duration-200 fade-in-50">
                <h3 className="font-semibold text-lg">Add Information</h3>
                <StepOrderMeta form={form} />
              </div>
            </Step>

            <Step>
              <div className="py-2 animate-in duration-200 fade-in-50">
                <h3 className="font-semibold text-lg">Review Basket Items</h3>
                <ReceiptPreview form={form} />
              </div>
            </Step>
          </Stepper>

          {/* Minimal footer action block tucked underneath the stepper bar */}
          <div className="flex justify-center bg-background px-8 pt-2 pb-4 border-t">
            <DrawerClose asChild>
              <Button className="w-full">Minimize</Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function StepBasket() {
  const cart = useCartStore((state) => state.cart)

  const menuItems = useQuery(api.restaurant.menuItems.listMenuItems)

  if (menuItems === undefined) {
    return (
      <div className="flex justify-center items-center h-[250px]">
        <SplashScreen />
      </div>
    )
  }

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  )

  if (cart.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 bg-muted/5 px-4 py-8 border border-dashed rounded-xl text-muted-foreground select-none">
        <ShoppingBagIcon className="stroke-[1.5] w-6 h-6" />
        <p className="font-medium text-sm">Your basket is empty</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 bg-background shadow-sm mx-auto p-4 border rounded-xl max-w-md">
      {/* Scrollable Item Container */}
      <ScrollArea className="flex flex-col pr-1 divide-y divide-border/60 max-h-[340px] overflow-y-auto">
        {cart.map((item) => {
          const sourceItem = menuItems.find((m) => m._id === item.itemId)
          const maxStock = sourceItem?.stockCount ?? 0

          // This is reactive
          const hasStockConflict = item.quantity > maxStock

          return (
            <div
              key={item.itemId}
              className={cn(
                'group flex flex-col gap-2 px-2 py-3 first:pt-0 last:pb-0 rounded-lg transition-colors',
                hasStockConflict &&
                  'bg-destructive/5 border border-destructive/30 my-1',
              )}
            >
              {/* Top Row: Image, Info, Counter */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0 bg-muted border border-border/40 rounded-lg w-12 h-12 overflow-hidden">
                  <div className="relative flex flex-shrink-0 justify-center items-center bg-muted border border-border/40 rounded-lg w-12 h-12 overflow-hidden">
                    {item.photoURL ? (
                      <img
                        src={item.photoURL}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform"
                      />
                    ) : (
                      <DonutImage className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col flex-1 justify-center min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-medium text-foreground text-sm truncate">
                      {item.name}
                    </span>
                    <span className="flex-shrink-0 font-semibold tabular-nums text-foreground text-sm">
                      Rs. {item.price * item.quantity}
                    </span>
                  </div>
                </div>

                {/* Micro Counter Controls */}
                <div className="flex items-center self-center gap-1.5 bg-muted/60 ml-2 p-1 border border-border/40 rounded-lg">
                  <Button
                    variant={'outline'}
                    onClick={() => decrementItem(item.itemId)}
                    className="flex justify-center items-center p-0 w-6 h-6"
                    type="button"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="stroke-[2.5] w-3 h-3" />
                  </Button>

                  <span
                    className={cn(
                      'w-5 font-bold tabular-nums text-sm text-center select-none',
                      hasStockConflict ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {item.quantity}
                  </span>

                  <Button
                    variant={'outline'}
                    disabled={item.quantity >= maxStock}
                    onClick={() =>
                      addItem({
                        _id: item.itemId,
                        name: item.name,
                        price: item.price,
                        photoURL: item.photoURL,
                      })
                    }
                    className={cn(
                      'flex justify-center items-center p-0 w-6 h-6',
                      item.quantity >= maxStock &&
                        'opacity-40 cursor-not-allowed pointer-events-none',
                    )}
                    type="button"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="stroke-[2.5] w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Dynamic Warning Indicator */}
              {hasStockConflict && (
                <div className="flex items-center gap-1.5 pl-1 font-medium text-destructive text-xs">
                  <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Stock conflict! Only {maxStock} left in kitchen.</span>
                </div>
              )}

              {/* Special Instructions Notes field */}
              <div className="w-full">
                <Input
                  type="text"
                  placeholder="Notes: no mayo, extra cheese..."
                  value={item.notes || ''}
                  onChange={(e) => {
                    AddNote(item.itemId, e.target.value)
                  }}
                  className="bg-muted/30 focus-visible:bg-background border-border/50 focus-visible:ring-1 h-7 text-sm"
                />
              </div>

              {/* Complimentary Checkbox */}
              <div className="flex items-center gap-2 mt-0.5 pl-1">
                <input
                  type="checkbox"
                  id={`comp-${item.itemId}`}
                  checked={item.isComplimentary}
                  onChange={() => toggleComplimentary(item.itemId)}
                  className="border-muted-foreground/35 rounded w-3.5 h-3.5 accent-primary cursor-pointer"
                />
                <label
                  htmlFor={`comp-${item.itemId}`}
                  className="font-medium text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer select-none"
                >
                  Mark as Complimentary
                </label>
              </div>
            </div>
          )
        })}
      </ScrollArea>

      {/* Footer Summary Card */}
      <div className="flex justify-between items-center mt-1 pt-3 border-border border-t font-semibold text-foreground text-sm">
        <span className="font-medium text-muted-foreground">Subtotal</span>
        <span className="tabular-nums text-base">Rs. {subtotal}</span>
      </div>
    </div>
  )
}

const StepOrderMeta = withForm({
  defaultValues: defaultOrderMetaValues,

  render: ({ form }) => {
    const branches = useQuery(api.restaurant.branches.listBranches)
    const payLaterCustomers = useQuery(
      api.restaurant.payLaterCustomers.listPayLaterCustomers,
    )
    return (
      <div className="py-16 h-full min-h-fit">
        <div className="gap-3 grid grid-cols-2">
          <form.Field name="branchId">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Branch</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as Id<'branches'>)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches ? (
                      branches.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="flex justify-center items-center py-6 w-full">
                        <LoaderIcon className="w-4 h-4 text-muted-foreground animate-spin" />
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length ? (
                  <em style={{ color: 'red' }}>
                    {field.state.meta.errors
                      .map((error: any) =>
                        typeof error === 'object' ? error.message : error,
                      )
                      .join(', ')}
                  </em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="orderDate">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Date</Label>
                <DatePickerWithPresets
                  className="w-full"
                  selected={new Date(field.state.value)}
                  onSelect={(val) =>
                    field.handleChange((val ?? new Date()).getTime())
                  }
                />
              </div>
            )}
          </form.Field>

          <form.Field name="kotNumber">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">KOT Number</Label>
                <Input
                  placeholder="e.g., 042"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>

          <form.Field name="tableNumber">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Table Number</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 4"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  className="flex bg-transparent shadow-sm px-3 py-1 border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full h-9 placeholder:text-muted-foreground text-sm"
                  onChange={(e) => {
                    const raw = e.target.value

                    if (raw === '') {
                      field.handleChange(undefined)
                      return
                    }

                    if (/^[0-9]*$/.test(raw)) {
                      field.handleChange(parseInt(raw, 10))
                    }
                  }}
                />
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>

          <form.Field name="orderType">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Order Type</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as OrderMeta['orderType'])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>

          <form.Field name="deliveryCharge">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Delivery Charge</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 4"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  className="flex bg-transparent shadow-sm px-3 py-1 border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full h-9 placeholder:text-muted-foreground text-sm"
                  onChange={(e) => {
                    const raw = e.target.value

                    if (raw === '') {
                      field.handleChange(0)
                      return
                    }

                    if (/^[0-9]*$/.test(raw)) {
                      field.handleChange(parseInt(raw, 10))
                    }
                  }}
                />
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>

          <form.Field name="totalDiscount">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Discount</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 4"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  className="flex bg-transparent shadow-sm px-3 py-1 border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full h-9 placeholder:text-muted-foreground text-sm"
                  onChange={(e) => {
                    const raw = e.target.value

                    if (raw === '') {
                      field.handleChange(0)
                      return
                    }

                    if (/^[0-9]*$/.test(raw)) {
                      field.handleChange(parseInt(raw, 10))
                    }
                  }}
                />
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>

          <form.Field name="taxAmount">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Tax Amount</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 4"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  className="flex bg-transparent shadow-sm px-3 py-1 border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full h-9 placeholder:text-muted-foreground text-sm"
                  onChange={(e) => {
                    const raw = e.target.value

                    if (raw === '') {
                      field.handleChange(0)
                      return
                    }

                    if (/^[0-9]*$/.test(raw)) {
                      field.handleChange(parseInt(raw, 10))
                    }
                  }}
                />
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Pay Later Customer</Label>
          </div>

          <form.Field name="payLaterCustomerId">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as Id<'payLaterCustomers'>)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {payLaterCustomers ? (
                      payLaterCustomers.map((payLaterCustomer) => (
                        <SelectItem
                          key={payLaterCustomer._id}
                          value={payLaterCustomer._id}
                        >
                          {payLaterCustomer.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="flex justify-center items-center py-6 w-full">
                        <LoaderIcon className="w-4 h-4 text-muted-foreground animate-spin" />
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <em style={{ color: 'red' }}>
                  {field.state.meta.errors
                    .map((error: any) =>
                      typeof error === 'object' ? error.message : error,
                    )
                    .join(', ')}
                </em>
              </div>
            )}
          </form.Field>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Payment Method</Label>
          </div>

          <form.Field name="paymentMethod">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as 'cash' | 'esewa' | 'bank')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>

                {field.state.meta.errors.length > 0 && (
                  <em className="font-medium text-destructive text-xs">
                    {field.state.meta.errors
                      .map((error: any) =>
                        typeof error === 'object' ? error.message : error,
                      )
                      .join(', ')}
                  </em>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </div>
    )
  },
})
