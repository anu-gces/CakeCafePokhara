import { Link, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  TransitioningDrawerContent,
} from '@/components/ui/drawer'
import {
  ShoppingCartIcon,
  PlusIcon,
  DonutIcon,
  MinusIcon,
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
  SquarePenIcon,
  PartyPopperIcon,
  Trash2Icon,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrderDocument } from '@/firebase/takeOrder'
import {
  getAllCreditors,
  getKitchenDepartmentFcmTokens,
  deleteUserFcmTokenByUid,
} from '@/firebase/firestore'
import { getFoodItems } from '@/firebase/menuManagement'

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
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
import * as Yup from 'yup'
import type { FoodItemProps } from '@/firebase/menuManagement'
import { Switch } from '../ui/switch'
import type { AddToCart } from '@/firebase/takeOrder'

// Menu Card Component
function MenuCard({
  foods,
  addToCart,
  handleAddToCart,
}: {
  foods: FoodItemProps[]
  addToCart: AddToCart
  handleAddToCart: (food: FoodItemProps) => void
}) {
  // All foods have the same type, so use the first item's type or name as the heading
  const type = foods[0]?.type?.toUpperCase() || foods[0]?.name.toUpperCase()

  const getRemainingStock = (foodId: string, currentStock?: number) => {
    const cartItem = addToCart.items.find((item) => item.foodId === foodId)
    const qtyInCart = cartItem?.qty ?? 0 // 0 if not in cart
    return (currentStock ?? 0) - qtyInCart
  }

  return (
    <div className="mb-8 p-4 border rounded-xl">
      <h2 className="mb-3 font-bold text-xl tracking-wide">{type}</h2>
      <div className="flex flex-col gap-2">
        {foods.map((food) => {
          const isDisabled =
            getRemainingStock(food.foodId, food.currentStockCount) <= 0
          return (
            <div
              key={food.foodId}
              className={cn(
                'flex items-center gap-3 active:bg-accent p-4 border rounded-xl transition-colors',
                isDisabled && 'opacity-50 cursor-not-allowed ',
              )}
              onClick={() => {
                if (!isDisabled) handleAddToCart(food)
              }}
              role="button"
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
            >
              <div className="flex justify-center items-center bg-gray-100 rounded-lg w-16 h-16">
                {food.photoURL ? (
                  <img
                    alt={food.name}
                    src={food.photoURL}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <DonutImage />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{food.name}</h3>
                <p className="text-muted-foreground text-sm">
                  Rs. {food.price}
                </p>
                {food.currentStockCount ? (
                  <span
                    className={cn(
                      'inline-block mt-1 px-2 py-0.5 rounded-full font-medium text-xs',
                      food.currentStockCount === 0
                        ? 'bg-red-100 text-red-700'
                        : food.currentStockCount < 10
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700',
                    )}
                  >
                    {food.currentStockCount === 0
                      ? 'Out of Stock'
                      : food.currentStockCount < 10
                        ? `Low Stock (${getRemainingStock(food.foodId, food.currentStockCount)})`
                        : `In Stock (${getRemainingStock(food.foodId, food.currentStockCount)})`}
                  </span>
                ) : (
                  <span
                    className={
                      'inline-block mt-1 px-2 py-0.5 rounded-full font-medium text-xs bg-red-100 text-red-700'
                    }
                  >
                    Out of Stock
                  </span>
                )}
              </div>
              {/* Edit and Delete Buttons */}
              <div className="flex gap-2">
                <PlusIcon />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Cart Preview Component

function CartPreview({ cart }: { cart: AddToCart }) {
  return (
    <AnimatePresence>
      {cart.items.length > 0 && (
        <motion.div
          key="cart-preview"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
          className="right-4 bottom-16 left-4 z-40 fixed bg-transparent shadow-lg backdrop-blur-[0.5rem] p-4 border rounded-lg"
          drag="y"
          dragConstraints={{ top: -400, bottom: 0 }}
          dragTransition={{
            power: 0.2, // Lower = more resistance
            timeConstant: 200, // Higher = more resistance
            bounceStiffness: 600, // Higher = snappier return
            bounceDamping: 30, // Higher = less bounce
          }}
        >
          <h3 className="mb-2 font-medium">Cart Preview</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {cart.items.map((item, index) => (
              <div key={item.foodId} className="flex justify-between text-sm">
                <span>
                  <span>
                    {index + 1}
                    {') '}
                  </span>
                  {item.qty}x {item.name}
                  <span className="text-muted-foreground">
                    {item.type && `(${item.type})`}
                  </span>
                </span>
                <span>Rs. {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between font-medium">
              <span>
                Total: {cart.items.reduce((sum, item) => sum + item.qty, 0)}{' '}
                items
              </span>
              <span>
                Rs.{' '}
                {cart.items
                  .reduce((sum, item) => sum + item.price * item.qty, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Validation schema - only KOT number is mandatory
const orderValidationSchema = Yup.object().shape({
  kotNumber: Yup.string()
    .required('KOT number is required')
    .min(1, 'KOT number cannot be empty'),
})

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
  kotNumber,
  setKotNumber,
  discountAmount,
  setDiscountAmount,
  taxAmount,
  setTaxAmount,
  deliveryFee,
  setDeliveryFee,
  isComplementary,
  setIsComplementary,
  remarks,
  setRemarks,
  selectedCreditor,
  setSelectedCreditor,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  step,
  setStep,
  receiptDate,
  setReceiptDate,
}: {
  cart: AddToCart
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdateQuantity: (index: number, newQty: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  selectedTable: number
  setSelectedTable: (table: number) => void
  kotNumber: string
  setKotNumber: (number: string) => void
  discountAmount: number
  setDiscountAmount: (a: number) => void
  taxAmount: number
  setTaxAmount: (a: number) => void
  deliveryFee: number
  setDeliveryFee: (fee: number) => void
  isComplementary: boolean
  setIsComplementary: (v: boolean) => void
  remarks: string
  setRemarks: (v: string) => void
  selectedCreditor: string
  setSelectedCreditor: (v: string) => void
  selectedPaymentMethod: 'cash' | 'esewa' | 'bank'
  setSelectedPaymentMethod: (v: 'cash' | 'esewa' | 'bank') => void
  step: boolean
  setStep: (v: boolean) => void
  receiptDate: Date | undefined
  setReceiptDate: (d: Date | undefined) => void
}) {
  const { data: creditors = [] } = useQuery({
    queryKey: ['creditors'],
    queryFn: getAllCreditors,
  })
  const queryClient = useQueryClient()

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Validate form whenever kotNumber changes
  useEffect(() => {
    const validateForm = async () => {
      try {
        await orderValidationSchema.validate(
          { kotNumber },
          { abortEarly: false },
        )
        setValidationErrors({})
        setIsFormValid(true)
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errors: Record<string, string> = {}
          error.inner.forEach((err) => {
            if (err.path) {
              errors[err.path] = err.message
            }
          })
          setValidationErrors(errors)
          setIsFormValid(false)
        }
      }
    }
    validateForm()
  }, [kotNumber])

  const enterOrderMutation = useMutation({
    mutationFn: createOrderDocument,
    onSuccess: async (_, addToCart) => {
      toast.success('Order placed successfully!')
      // Optionally reset cart/order state here
      setStep(false)
      // If you have a Drawer open state, close it here (setOpen(false))

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
          toast.success('Kitchen notification sent successfully!')
        } else {
          toast.info('No kitchen staff to notify')
        }
      } catch (err) {
        toast.error('Failed to send kitchen notification')
      }
      await queryClient.invalidateQueries({ queryKey: ['foods'] })
      onClearCart()
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`)
    },
  })

  const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  )
  // Calculate discount and tax
  // discountAmount and taxAmount are now absolute values
  // Final total includes manual rounding and delivery fee
  const totalAmount = subtotal - discountAmount + taxAmount + deliveryFee

  // Submit handler
  const handleSubmit = () => {
    const addToCart = {
      items: cart.items,
      kotNumber,
      discountAmount,
      taxAmount,
      tableNumber: selectedTable,
      complementary: isComplementary,
      remarks,
      deliveryFee: deliveryFee || 0,
      receiptDate: receiptDate
        ? receiptDate.toISOString()
        : new Date().toISOString(),
      paymentMethod: selectedPaymentMethod,
      creditor: selectedCreditor || null,
      status: 'pending' as const,
      dismissed: false, // Set dismissed to false by default for notification purposes
    }

    enterOrderMutation.mutate(addToCart)
  }

  const [discountInput, setDiscountInput] = useState(discountAmount.toString())
  const [taxInput, setTaxInput] = useState(taxAmount.toString())
  const [deliveryFeeInput, setDeliveryFeeInput] = useState(
    deliveryFee ? deliveryFee.toString() : '0',
  )

  useEffect(() => {
    setDiscountInput(discountAmount.toString())
  }, [discountAmount])
  useEffect(() => {
    setTaxInput(taxAmount.toString())
  }, [taxAmount])
  useEffect(() => {
    setDeliveryFeeInput(deliveryFee.toString())
  }, [deliveryFee])

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      shouldScaleBackground
      setBackgroundColorOnScale
    >
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
            <span className="font-semibold text-primary text-base">
              <>
                <span className="bg-yellow-100 mr-1 px-2 py-0.5 rounded text-yellow-800">
                  {totalItems} item in your cart
                </span>
                • Rs. {totalAmount.toFixed(2)}
              </>
            </span>
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
              {cart.items.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-8 text-muted-foreground">
                  <div className="mb-2 text-4xl">
                    <ShoppingCartIcon />
                  </div>
                  <span className="text-sm">Your cart is empty</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-card p-4 border border-border rounded-xl">
                    <Label
                      htmlFor="kotNumber"
                      className="block mb-2 font-medium text-foreground text-sm"
                    >
                      KOT Number *
                    </Label>
                    <Input
                      id="kotNumber"
                      type="text"
                      placeholder="Enter KOT number"
                      value={kotNumber}
                      onChange={(e) => setKotNumber(e.target.value)}
                      className={cn(
                        'bg-background border-border',
                        validationErrors.kotNumber &&
                          'border-destructive focus:ring-destructive',
                      )}
                      required
                    />
                    {validationErrors.kotNumber && (
                      <p className="mt-2 text-destructive text-xs">
                        {validationErrors.kotNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {cart.items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-card shadow-xs p-4 border border-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-shrink-0 justify-center items-center bg-gray-100 rounded w-10 h-10 overflow-hidden">
                            {item.photoURL ? (
                              <img
                                src={item.photoURL}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <DonutImage className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">
                              {item.name}
                            </h4>
                            <p className="text-muted-foreground text-xs">
                              {item.qty} × Rs. {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="ml-2 font-bold text-foreground">
                            Rs. {(item.price * item.qty).toFixed(2)}
                          </div>

                          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-background w-8 h-8"
                              onClick={() => {
                                onUpdateQuantity(
                                  index,
                                  Math.max(0, item.qty - 1),
                                )
                              }}
                            >
                              <MinusIcon className="w-4 h-4" />
                            </Button>

                            <span className="w-8 font-semibold text-sm text-center">
                              {item.qty}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-background w-8 h-8"
                              disabled={
                                item.qty >= (item.currentStockCount ?? 0)
                              }
                              onClick={() => {
                                onUpdateQuantity(index, item.qty + 1)
                              }}
                            >
                              <PlusIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="hover:bg-background w-10 h-10"
                            onClick={() => {
                              onRemoveItem(index)
                            }}
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                          <div className="flex flex-col justify-center h-full text-right">
                            <div className="font-bold text-foreground">
                              Rs. {(item.price * item.qty).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 bg-card p-4 border border-border rounded-xl">
                    <Label className="mb-3 font-semibold text-foreground">
                      Billing Adjustments (Not in Percent)
                    </Label>

                    <div className="flex justify-between items-center">
                      <Label className="font-medium text-foreground">
                        Discount Amount
                      </Label>
                      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() =>
                            setDiscountAmount(Math.max(0, discountAmount - 1))
                          }
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="bg-background border-0 w-32 h-8 text-sm text-center"
                          value={discountInput}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^\d*$/.test(val) || val === '')
                              setDiscountInput(val)
                          }}
                          onBlur={() => {
                            if (
                              discountInput === '' ||
                              isNaN(Number(discountInput))
                            ) {
                              setDiscountInput('0')
                              setDiscountAmount(0)
                            } else {
                              setDiscountAmount(Number(discountInput))
                            }
                          }}
                          min="0"
                          step="1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => setDiscountAmount(discountAmount + 1)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Label className="font-medium text-foreground">
                        Tax Amount
                      </Label>
                      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() =>
                            setTaxAmount(Math.max(0, taxAmount - 1))
                          }
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="bg-background border-0 w-32 h-8 text-sm text-center"
                          value={taxInput}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^\d*$/.test(val) || val === '')
                              setTaxInput(val)
                          }}
                          onBlur={() => {
                            if (taxInput === '' || isNaN(Number(taxInput))) {
                              setTaxInput('0')
                              setTaxAmount(0)
                            } else {
                              setTaxAmount(Number(taxInput))
                            }
                          }}
                          min="0"
                          step="1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => setTaxAmount(taxAmount + 1)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Label className="font-medium text-foreground">
                        Delivery Fee
                      </Label>
                      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() =>
                            setDeliveryFee(Math.max(0, deliveryFee - 1))
                          }
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="bg-background border-0 w-32 h-8 text-sm text-center"
                          value={deliveryFeeInput}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^\d*$/.test(val) || val === '')
                              setDeliveryFeeInput(val)
                          }}
                          onBlur={() => {
                            if (
                              deliveryFeeInput === '' ||
                              isNaN(Number(deliveryFeeInput))
                            ) {
                              setDeliveryFeeInput('0')
                              setDeliveryFee(0)
                            } else {
                              setDeliveryFee(Number(deliveryFeeInput))
                            }
                          }}
                          min="0"
                          step="1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => setDeliveryFee(deliveryFee + 1)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-card p-4 border border-border rounded-xl">
                    <Label className="mb-3 font-semibold text-foreground">
                      Order Options
                    </Label>
                    <div className="flex justify-between items-center">
                      <Label className="font-medium text-foreground">
                        Complementary
                      </Label>
                      <Switch
                        checked={isComplementary}
                        onCheckedChange={setIsComplementary}
                        aria-label="Toggle complementary order"
                        className="ml-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-foreground text-sm">
                        Creditor (Optional)
                      </Label>
                      <Select
                        value={selectedCreditor}
                        onValueChange={setSelectedCreditor}
                      >
                        <SelectTrigger className="bg-background border-border">
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
                    <div className="space-y-2">
                      <Label className="font-medium text-foreground text-sm">
                        Payment Method
                      </Label>
                      <Select
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Choose payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="esewa">eSewa</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-foreground text-sm">
                        Date (Optional)
                      </Label>
                      <DatePickerWithPresets
                        selected={receiptDate}
                        onSelect={setReceiptDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="remarks"
                        className="font-medium text-foreground text-sm"
                      >
                        Remarks
                      </Label>
                      <Input
                        id="remarks"
                        type="text"
                        placeholder="Add any remarks (optional)"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-card to-card/50 p-4 border border-border rounded-xl">
                    <Label className="mb-3 font-semibold text-foreground">
                      Bill Summary
                    </Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          Rs. {subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-destructive">
                          - Rs. {discountAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">
                          + Rs. {taxAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Delivery Fee
                        </span>
                        <span className="font-medium">
                          + Rs. {deliveryFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total</span>
                          <span className="font-bold text-primary text-xl">
                            Rs. {totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
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
          {cart.items.length > 0 && (
            <>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-muted p-4 rounded-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">
                  Rs. {totalAmount.toFixed(2)}
                </span>
              </div>
              <motion.button
                className={cn(
                  'flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-md w-full text-white transition-colors',
                )}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => {
                  if (isFormValid || step === true) {
                    setStep(!step)
                  }
                }}
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
                  cart.items.length === 0 ||
                  step === false ||
                  enterOrderMutation.isPending
                }
              >
                {enterOrderMutation.isPending ? (
                  <>
                    <LoaderIcon
                      color="white"
                      className="mr-2 w-4 h-4 text-white animate-spin"
                    />
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
            { title: 'Others', icon: PartyPopperIcon, search: 'others' },
          ]}
          to="/home/takeOrder"
          className="min-w-full"
        />
      </div>
    </>
  )
}

const emptyCart: AddToCart = {
  kotNumber: '',
  items: [],
  discountAmount: 0,
  taxAmount: 0,
  tableNumber: -1,
  complementary: false,
  remarks: '',
  receiptDate: new Date().toISOString(),
  paymentMethod: 'cash',
  deliveryFee: 0,
  creditor: null,
  status: 'pending',
}

// Main TakeOrder Component
export function TakeOrder() {
  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foods'],
    queryFn: async () => {
      const data = await getFoodItems()

      return data
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const { userAdditional } = useFirebaseAuth()
  const [cart, setCart] = useState<AddToCart>(emptyCart)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const { category: selectedCategory } = useSearch({ from: '/home/takeOrder' })

  // SeatingPlan state
  const [selectedTable, setSelectedTable] = useState<number>(-1)

  // Move all order-related state to parent
  const [kotNumber, setKotNumber] = useState<string>('')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxAmount, setTaxAmount] = useState<number>(0)
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [isComplementary, setIsComplementary] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [selectedCreditor, setSelectedCreditor] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash' | 'esewa' | 'bank'
  >('cash')
  const [step, setStep] = useState(false) // Move step state to parent
  const [search, setSearch] = useState('')
  const [receiptDate, setReceiptDate] = useState<Date | undefined>(undefined)

  const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0)

  const handleAddToCart = (food: FoodItemProps) => {
    setCart((prev) => {
      // Check if the item already exists in the cart
      const existingIndex = prev.items.findIndex(
        (item) => item.foodId === food.foodId,
      )

      let newItems
      if (existingIndex !== -1) {
        // If exists, increment qty
        newItems = prev.items.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: item.qty + 1 } : item,
        )
      } else {
        // If not, add new item with qty 1
        newItems = [...prev.items, { ...food, qty: 1 }]
      }

      return {
        ...prev,
        items: newItems,
      }
    })
  }

  const updateCartQuantity = (index: number, newQty: number) => {
    setCart((prev) => {
      if (newQty === 0) {
        // Remove the item if qty is 0
        return {
          ...prev,
          items: prev.items.filter((_, i) => i !== index),
        }
      }
      // Update the quantity for the item at the given index
      return {
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, qty: newQty } : item,
        ),
      }
    })
  }

  const removeCartItem = (index: number) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
    toast.info('Item removed from cart')
  }

  // Enhanced clearCart: resets all order state
  const clearCart = () => {
    setCart(emptyCart)
    setSelectedTable(-1)
    setKotNumber('')
    setDiscountAmount(0)
    setTaxAmount(0)
    setDeliveryFee(0)
    setIsComplementary(false)
    setRemarks('')
    setSelectedCreditor('')
    setSelectedPaymentMethod('cash')
    setStep(false) // Reset stepper
    setCartDrawerOpen(false)
    setReceiptDate(undefined)
  }

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <div className="bg-background h-full overflow-y-auto">
      {/* Header with Cart Summary */}
      <div className="top-0 z-50 sticky bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
        <div className="flex justify-between items-center p-4">
          <div>
            {(userAdditional?.role === 'admin' ||
              userAdditional?.role === 'owner') && (
              <Link
                to="/home/menuManagement"
                search={{ category: 'appetizers' }}
                viewTransition={{ types: ['slide-left'] }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-primary transition-colors"
                title="Go to Orders"
              >
                <span className="font-medium text-sm">Edit Menu</span>
                <SquarePenIcon className="size-4" />
              </Link>
            )}
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
                  {cart.items.reduce((sum, item) => sum + item.qty, 0)} items
                </div>
                <div className="text-muted-foreground text-xs">
                  Rs.{' '}
                  {cart.items
                    .reduce((sum, item) => sum + item.price * item.qty, 0)
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
              className="pl-10 border-x-0 rounded-none"
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
        <div className="space-y-0 px-4">
          <AnimatePresence>
            {Object.values(
              foods
                .filter((food) => {
                  if (search.trim()) {
                    const searchLower = search.toLowerCase()
                    const inName = food.name.toLowerCase().includes(searchLower)
                    const inCategory = food.mainCategory
                      .toLowerCase()
                      .includes(searchLower)
                    return inName || inCategory
                  } else {
                    return (
                      selectedCategory === '' ||
                      food.mainCategory === selectedCategory
                    )
                  }
                })
                .reduce<Record<string, FoodItemProps[]>>((acc, food) => {
                  const groupKey = food.type ?? food.name.toLowerCase()
                  if (!acc[groupKey]) acc[groupKey] = []
                  acc[groupKey].push(food)
                  return acc
                }, {}),
            ).map((foodsOfType) => (
              <motion.div
                key={foodsOfType[0].type ?? foodsOfType[0].name}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <MenuCard
                  addToCart={cart}
                  handleAddToCart={handleAddToCart}
                  foods={foodsOfType}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {foods.filter((food) => {
          if (!search.trim()) return false // Only show empty state if search is active and no results
          const searchLower = search.toLowerCase()
          const inName = food.name.toLowerCase().includes(searchLower)
          const inCategory = food.mainCategory
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
        kotNumber={kotNumber}
        setKotNumber={setKotNumber}
        discountAmount={discountAmount ?? 0}
        setDiscountAmount={setDiscountAmount}
        taxAmount={taxAmount ?? 0}
        setTaxAmount={setTaxAmount}
        deliveryFee={deliveryFee}
        setDeliveryFee={setDeliveryFee}
        isComplementary={isComplementary}
        setIsComplementary={setIsComplementary}
        remarks={remarks}
        setRemarks={setRemarks}
        selectedCreditor={selectedCreditor}
        setSelectedCreditor={setSelectedCreditor}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        step={step}
        setStep={setStep}
        receiptDate={receiptDate}
        setReceiptDate={setReceiptDate}
      />
    </div>
  )
}
