import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  TransitioningDrawerContent,
} from '@/components/ui/drawer'
import {
  ShoppingCartIcon,
  ChevronRightIcon,
  PlusIcon,
  DonutIcon,
  MinusIcon,
  Trash2Icon,
  SandwichIcon,
  PizzaIcon,
  IceCreamIcon,
  CoffeeIcon,
  BeerIcon,
  SparklesIcon,
  UtensilsCrossedIcon,
  RotateCwIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LoaderIcon,
  SearchIcon,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createOrderDocument,
  getAllCreditors,
  getFoodItems,
  getKitchenDepartmentFcmTokens,
  deleteUserFcmTokenByUid,
} from '@/firebase/firestore'
import {
  type FoodItemProps,
  type SubcategoryOption,
  categories,
} from '@/components/restaurant_mobile/menuManagement'
import { type Search } from './menuManagement'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import DonutImage from '@/assets/donutImage'
import SplashScreen from '@/components/splashscreen'
import { cn } from '@/lib/utils'
import { SeatingPlan } from '@/components/restaurant_mobile/seatingPlan'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/home/takeOrder')({
  validateSearch: (search: Record<string, unknown>): Search => {
    const validCategories = categories.map((cat) => cat.id)
    const category = search.category as string
    return {
      category: validCategories.includes(category) ? category : '',
    }
  },
  component: () => {
    return (
      <>
        <TakeOrder />
      </>
    )
  },
})

type CartItem = Omit<FoodItemProps, 'foodPhoto'> & {
  qty: number
  selectedSubcategory?: SubcategoryOption | null
  finalPrice: number
}

// Menu Card Component
function MenuCard({
  food,
  handleAddToCart,
}: {
  food: FoodItemProps
  handleAddToCart: (
    food: FoodItemProps,
    subcategory?: SubcategoryOption,
  ) => void
}) {
  const [subcategoryDrawerOpen, setSubcategoryDrawerOpen] = useState(false)

  const handleCardClick = () => {
    if (
      food.hasSubcategories &&
      food.subcategories &&
      food.subcategories.length > 0
    ) {
      setSubcategoryDrawerOpen(true)
    } else {
      handleAddToCart(food)
    }
  }

  const handleSubcategorySelect = (subcategory: SubcategoryOption) => {
    handleAddToCart(food, subcategory)
    setSubcategoryDrawerOpen(false)
  }

  return (
    <>
      <div
        className="relative flex items-center gap-3 bg-background hover:bg-gray-50 dark:hover:bg-muted p-3 border-b transition-colors duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex justify-center items-center bg-gray-100 rounded-lg w-20 h-20">
          {typeof food.foodPhoto === 'string' && food.foodPhoto ? (
            <img
              alt={food.foodName}
              src={food.foodPhoto || '/placeholder.svg'}
              className="flex-shrink-0 rounded-lg w-20 h-20 object-cover"
            />
          ) : (
            <DonutImage />
          )}
        </div>

        <div className="flex flex-col flex-1 gap-1">
          <div className="flex items-center gap-2">
            <strong className="font-medium text-base">{food.foodName}</strong>
            {food.hasSubcategories && (
              <Badge variant="secondary" className="text-xs">
                Options
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {food.hasSubcategories
              ? `From Rs. ${food.foodPrice}`
              : `Rs. ${food.foodPrice}`}
          </p>
          {food.hasSubcategories && (
            <p className="text-muted-foreground text-xs">Tap to see options</p>
          )}
        </div>

        {food.hasSubcategories ? (
          <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
        ) : (
          <PlusIcon className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* Subcategory Selection Drawer */}
      <Drawer
        open={subcategoryDrawerOpen}
        onOpenChange={setSubcategoryDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{food.foodName}</DrawerTitle>
            <DrawerDescription>Choose your preferred option</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="space-y-2">
              {food.subcategories?.map((subcategory) => (
                <Button
                  key={subcategory.id}
                  variant="outline"
                  className="justify-between bg-transparent hover:bg-primary/5 p-4 w-full h-auto"
                  onClick={() => handleSubcategorySelect(subcategory)}
                >
                  <div className="text-left">
                    <div className="font-medium">{subcategory.name}</div>
                    <div className="text-muted-foreground text-sm">
                      Rs. {subcategory.price.toFixed(2)}
                    </div>
                  </div>
                  <PlusIcon className="w-5 h-5" />
                </Button>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

// Cart Preview Component
function CartPreview({ cart }: { cart: CartItem[] }) {
  if (cart.length === 0) return null

  return (
    <div className="right-4 bottom-16 left-4 z-40 fixed bg-card shadow-lg p-4 border rounded-lg">
      <h3 className="mb-2 font-medium">Cart Preview</h3>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.qty}x {item.foodName}
              {item.selectedSubcategory && (
                <span className="text-muted-foreground">
                  {' '}
                  ({item.selectedSubcategory.name})
                </span>
              )}
            </span>
            <span>Rs. {(item.finalPrice * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between font-medium">
          <span>
            Total: {cart.reduce((sum, item) => sum + item.qty, 0)} items
          </span>
          <span>
            Rs.{' '}
            {cart
              .reduce((sum, item) => sum + item.finalPrice * item.qty, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

export type AddToCart = {
  items: CartItem[]
  discountRate: number
  taxRate: number
  tableNumber: number
  complementary: boolean
  remarks: string
  manualRounding: number

  creditor?: string | null // Optional creditor field
  status:
    | 'pending'
    | 'ready_to_serve'
    | 'ready_to_pay'
    | 'paid'
    | 'credited'
    | 'cancelled'
    | 'dismissed'
}

// Cart Drawer Component
function CartDrawer({
  cart,
  isOpen,
  onOpenChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedTable,
  setSelectedTable,
  discountRate,
  setDiscountRate,
  taxRate,
  setTaxRate,
  manualRounding,
  setManualRounding,
  isComplementary,
  setIsComplementary,
  remarks,
  setRemarks,
  selectedCreditor,
  setSelectedCreditor,
  step,
  setStep,
}: {
  cart: CartItem[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdateQuantity: (index: number, newQty: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  selectedTable: number
  setSelectedTable: (table: number) => void
  discountRate: number
  setDiscountRate: (r: number) => void
  taxRate: number
  setTaxRate: (r: number) => void
  manualRounding: number
  setManualRounding: (r: number) => void
  isComplementary: boolean
  setIsComplementary: (v: boolean) => void
  remarks: string
  setRemarks: (v: string) => void
  selectedCreditor: string
  setSelectedCreditor: (v: string) => void
  step: boolean
  setStep: (v: boolean) => void
}) {
  const { data: creditors = [] } = useQuery({
    queryKey: ['creditors'],
    queryFn: getAllCreditors,
  })
  const queryClient = useQueryClient()
  // Add state for addToCart if you want to reset it (optional, not required if you always build from props)
  // const [addToCart, setAddToCart] = useState<AddToCart | null>(null);

  const enterOrderMutation = useMutation({
    mutationFn: createOrderDocument,
    onSuccess: async (_, addToCart) => {
      toast.success('Order placed successfully!')
      // Optionally reset cart/order state here
      onClearCart()
      setStep(false)
      // If you have a Drawer open state, close it here (setOpen(false))
      queryClient.invalidateQueries({ queryKey: ['getAllOrders'] })
      // --- Send FCM notification to kitchen department ---
      try {
        const tokensWithUid = await getKitchenDepartmentFcmTokens()
        const tokensOnly = tokensWithUid.map((t) => t.token)
        if (tokensWithUid.length > 0) {
          const response = await fetch('https://great-zebra-28.deno.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: tokensOnly,
              title: 'New Order',
              body: `New order placed at Table ${addToCart.tableNumber}`,
            }),
          })
          const { invalidTokens } = await response.json()
          const invalidUidTokenPairs = tokensWithUid.filter((t) =>
            invalidTokens.includes(t.token),
          )
          for (const { uid, token } of invalidUidTokenPairs) {
            await deleteUserFcmTokenByUid(uid, token)
          }
        }
      } catch (err) {
        console.error('Failed to send FCM notification:', err)
      }
    },
    onError: (error: any) => {
      console.error('Error placing order:', error)
      toast.error(`Error: ${error.message}`)
    },
  })

  // Local state for rounding input as string
  const [roundingInput, setRoundingInput] = useState(manualRounding.toString())

  // Keep input in sync with prop
  useEffect(() => {
    setRoundingInput(manualRounding.toString())
  }, [manualRounding])

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.finalPrice * item.qty,
    0,
  )
  // Calculate discount and tax
  const discountAmount = subtotal * (discountRate / 100)
  const taxedAmount = (subtotal - discountAmount) * (taxRate / 100)
  // Final total includes manual rounding
  const totalAmount = subtotal - discountAmount + taxedAmount + manualRounding

  // Submit handler
  const handleSubmit = () => {
    const addToCart: AddToCart = {
      items: cart,
      discountRate,
      taxRate,
      tableNumber: selectedTable,
      complementary: isComplementary,
      remarks,
      manualRounding,
      creditor: selectedCreditor || null,
      status: 'pending',
    }
    console.log('Submitting order:', addToCart)
    enterOrderMutation.mutate(addToCart)
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <TransitioningDrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            <div className="flex justify-between items-center gap-4">
              <span>Your Order</span>
              <Button variant="outline" onClick={onClearCart}>
                <RotateCwIcon />
                Clear Cart
              </Button>
            </div>
          </DrawerTitle>
          <DrawerDescription>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} • Rs.{' '}
            {totalAmount.toFixed(2)}
          </DrawerDescription>
        </DrawerHeader>

        {/* Stepper Animation */}
        {step === false ? (
          <motion.div
            layout
            key="cart-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 pb-4 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-8 text-muted-foreground">
                  <div className="mb-2 text-4xl">
                    <ShoppingCartIcon />
                  </div>
                  <span className="text-sm">Your cart is empty</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gray-50 dark:bg-muted p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.foodName}</div>
                        {item.selectedSubcategory && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.selectedSubcategory.name}
                          </Badge>
                        )}
                        <div className="text-muted-foreground text-sm">
                          Rs. {item.finalPrice.toFixed(2)} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent w-8 h-8"
                          onClick={() =>
                            onUpdateQuantity(index, Math.max(0, item.qty - 1))
                          }
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>

                        <span className="w-8 font-medium text-center">
                          {item.qty}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent w-8 h-8"
                          onClick={() => onUpdateQuantity(index, item.qty + 1)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent w-8 h-8 text-red-500 hover:text-red-700"
                          onClick={() => onRemoveItem(index)}
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          Rs. {(item.finalPrice * item.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Discount, Tax, and Manual Rounding: now stacked vertically for mobile */}
                  <div className="flex flex-col gap-2">
                    {/* Discount Section */}
                    <div className="flex flex-col justify-center">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-muted p-4 rounded-lg">
                        <span className="font-semibold">Discount</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent w-8 h-8"
                            onClick={() =>
                              setDiscountRate(Math.max(0, discountRate - 1))
                            }
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                          <span className="w-8 font-medium text-center">
                            {discountRate}%
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent w-8 h-8"
                            onClick={() =>
                              setDiscountRate(Math.min(100, discountRate + 1))
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Tax Section */}
                    <div className="flex flex-col justify-center">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-muted p-4 rounded-lg">
                        <span className="font-semibold">Tax</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent w-8 h-8"
                            onClick={() => setTaxRate(Math.max(0, taxRate - 1))}
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                          <span className="w-8 font-medium text-center">
                            {taxRate}%
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent w-8 h-8"
                            onClick={() =>
                              setTaxRate(Math.min(100, taxRate + 1))
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Manual Rounding Section */}
                    <div className="flex flex-col justify-center">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-muted p-4 rounded-lg">
                        <span className="font-semibold">Rounding</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent w-8 h-8"
                            onClick={() =>
                              setManualRounding(manualRounding - 1)
                            }
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                          <Input
                            type="text"
                            className="h-8"
                            value={roundingInput}
                            onChange={(e) => {
                              const val = e.target.value
                              setRoundingInput(val)
                              if (/^-?\d*$/.test(val) && val !== '-') {
                                const num = Number(val)
                                if (!isNaN(num)) setManualRounding(num)
                              }
                            }}
                            onBlur={() => {
                              // On blur, if input is not a valid number, reset to prop
                              if (
                                roundingInput === '-' ||
                                isNaN(Number(roundingInput))
                              ) {
                                setRoundingInput(manualRounding.toString())
                              } else {
                                setManualRounding(Number(roundingInput))
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent w-8 h-8"
                            onClick={() =>
                              setManualRounding(manualRounding + 1)
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Complimentary and Creditor: now stacked vertically for mobile */}
                  <div className="flex flex-col gap-2 mt-2">
                    {/* Is Complementary Toggle */}
                    <div className="flex flex-col justify-center">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-muted p-4 rounded-lg">
                        <span className="font-semibold">Is Complementary?</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={isComplementary}
                          onChange={(e) => setIsComplementary(e.target.checked)}
                        />
                      </div>
                    </div>
                    {/* Creditor Select */}
                    <div className="flex flex-col justify-center">
                      <div className="flex justify-center items-center gap-2 bg-gray-50 dark:bg-muted p-2 rounded-lg">
                        <Label
                          htmlFor="creditor"
                          className="block mb-1 text-nowrap"
                        >
                          Select Creditor (optional)
                        </Label>
                        <Select
                          value={selectedCreditor}
                          onValueChange={setSelectedCreditor}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a creditor" />
                          </SelectTrigger>
                          <SelectContent>
                            {creditors.map((c) => (
                              <SelectItem key={c.nickname} value={c.nickname}>
                                {c.nickname} ({c.firstName} {c.lastName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  {/* Remarks Row */}
                  <div className="flex mt-2">
                    <div className="flex flex-col w-full">
                      <Label htmlFor="remarks" className="mb-1">
                        Remarks
                      </Label>
                      <Input
                        id="remarks"
                        type="text"
                        placeholder="Add any remarks (optional)"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {/* Show subtotal, discount, tax, rounding, total breakdown */}
                  <div className="space-y-1 mt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount ({discountRate}%)</span>
                      <span>- Rs. {discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%)</span>
                      <span>+ Rs. {taxedAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rounding</span>
                      <span>
                        {manualRounding >= 0 ? '+ ' : '- '}Rs.{' '}
                        {Math.abs(manualRounding).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>Rs. {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="final-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SeatingPlan
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
            />
          </motion.div>
        )}

        <DrawerFooter>
          {cart.length > 0 && (
            <>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-muted p-4 rounded-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">
                  Rs. {totalAmount.toFixed(2)}
                </span>
              </div>
              <motion.button
                className={cn(
                  'flex justify-center items-center gap-2 bg-primary px-4 py-2 rounded-md w-full text-white',
                )}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setStep(!step)}
              >
                {step ? (
                  <motion.span
                    key="back"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 5, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeftIcon className="w-4 h-4" color="white" />
                    Back
                  </motion.span>
                ) : (
                  <motion.span
                    key="next"
                    initial={{ x: 5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -5, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 p-0"
                  >
                    Next
                    <ArrowRightIcon className="w-4 h-4" color="white" />
                  </motion.span>
                )}
              </motion.button>

              <Button
                onClick={handleSubmit}
                disabled={
                  cart.length === 0 ||
                  step === false ||
                  enterOrderMutation.isPending
                }
              >
                {enterOrderMutation.isPending ? (
                  <>
                    <LoaderIcon className="mr-2 w-4 h-4 text-white animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Order'
                )}
              </Button>
            </>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </TransitioningDrawerContent>
    </Drawer>
  )
}

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
          ]}
          to="/home/takeOrder"
          className="min-w-full"
        />
      </div>
    </>
  )
}

// Main TakeOrder Component
export function TakeOrder() {
  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foods'],
    queryFn: getFoodItems,
  })

  const [cart, setCart] = useState<CartItem[]>([])
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const { category: selectedCategory } = useSearch({ from: '/home/takeOrder' })

  // SeatingPlan state
  const [selectedTable, setSelectedTable] = useState<number>(-1)
  // Move all order-related state to parent
  const [discountRate, setDiscountRate] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(0)
  const [manualRounding, setManualRounding] = useState<number>(0)
  const [isComplementary, setIsComplementary] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [selectedCreditor, setSelectedCreditor] = useState<string>('')
  const [step, setStep] = useState(false) // Move step state to parent
  const [search, setSearch] = useState('')

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)

  const handleAddToCart = (
    food: FoodItemProps,
    subcategory?: SubcategoryOption,
  ) => {
    const finalPrice = food.foodPrice + (subcategory?.price || 0)

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.foodId === food.foodId &&
          item.selectedSubcategory?.id === subcategory?.id,
      )

      let updatedCart: CartItem[]

      if (existing) {
        updatedCart = prev.map((item) =>
          item.foodId === food.foodId &&
          item.selectedSubcategory?.id === subcategory?.id
            ? { ...item, qty: item.qty + 1 }
            : item,
        )
      } else {
        const newItem: CartItem = {
          ...food,
          qty: 1,
          selectedSubcategory: subcategory ?? null,
          finalPrice,
        }
        updatedCart = [...prev, newItem]
      }

      return updatedCart
    })
  }

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty === 0) {
      removeCartItem(index)
      return
    }
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty: newQty } : item)),
    )
  }

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
    toast.info('Item removed from cart')
  }

  // Enhanced clearCart: resets all order state
  const clearCart = () => {
    setCart([])
    setSelectedTable(-1)
    setDiscountRate(0)
    setTaxRate(0)
    setManualRounding(0)
    setIsComplementary(false)
    setRemarks('')
    setSelectedCreditor('')
    setStep(false) // Reset stepper
    setCartDrawerOpen(false)
  }

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <div className="bg-background h-full">
      {/* Header with Cart Summary */}
      <div className="top-0 z-50 sticky bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b">
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="font-bold text-xl">Order System</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="relative bg-transparent p-6"
              onClick={() => setCartDrawerOpen(true)}
            >
              <ShoppingCartIcon className="mr-2 w-4 h-4" />
              <div className="text-right">
                <div className="text-sm">
                  {cart.reduce((sum, item) => sum + item.qty, 0)} items
                </div>
                <div className="text-muted-foreground text-xs">
                  Rs.{' '}
                  {cart
                    .reduce((sum, item) => sum + item.finalPrice * item.qty, 0)
                    .toFixed(2)}
                </div>
              </div>
              {totalItems > 0 && (
                <span className="-top-2 -right-2 absolute flex justify-center items-center bg-red-500 rounded-full w-5 h-5 text-white text-xs">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-transparent p-6"
              onClick={clearCart}
            >
              <RotateCwIcon />
              Clear
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="">
          <CategoryTabs />
          <div className="top-[48px] z-10 sticky py-2">
            <SearchIcon className="top-1/2 left-4 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>
          {search !== '' && (
            <p className="mb-2 ml-4 text-gray-500 text-xs italic">
              Showing results across all categories
            </p>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="pb-32">
        <div className="space-y-0">
          <AnimatePresence>
            {foods
              .filter((food) => food.foodCategory === selectedCategory)
              .map((food) => (
                <motion.div key={food.foodId} layout>
                  <MenuCard food={food} handleAddToCart={handleAddToCart} />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {foods.filter((food) => food.foodCategory === selectedCategory)
          .length === 0 && (
          <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
            <div className="mb-2 text-4xl">
              <UtensilsCrossedIcon />
            </div>
            <span className="text-sm">No items in this category</span>
          </div>
        )}
      </div>

      {/* Cart Preview */}
      <CartPreview cart={cart} />

      {/* Cart Drawer */}
      <CartDrawer
        cart={cart}
        isOpen={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        discountRate={discountRate}
        setDiscountRate={setDiscountRate}
        taxRate={taxRate}
        setTaxRate={setTaxRate}
        manualRounding={manualRounding}
        setManualRounding={setManualRounding}
        isComplementary={isComplementary}
        setIsComplementary={setIsComplementary}
        remarks={remarks}
        setRemarks={setRemarks}
        selectedCreditor={selectedCreditor}
        setSelectedCreditor={setSelectedCreditor}
        step={step}
        setStep={setStep}
      />
    </div>
  )
}
