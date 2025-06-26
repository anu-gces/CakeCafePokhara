import CakeCafeLogo from '@/assets/Logo.png'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BeerIcon,
  CoffeeIcon,
  DonutIcon,
  GhostIcon,
  IceCreamIcon,
  LoaderIcon,
  NotebookPenIcon,
  PizzaIcon,
  PlusIcon,
  RotateCwIcon,
  SandwichIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react'

import { Route as editMenuRoute } from '@/routes/home/editMenu'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useState } from 'react'

import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import { MenuCard } from './menuCard'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  TransitioningDrawerContent,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadMenuItemImage } from '@/firebase/firebase_storage'
import {
  createOrderDocument,
  deleteUserFcmTokenByUid,
  enterFoodItem,
  getAllCreditors,
  getFoodItems,
  getKitchenDepartmentFcmTokens,
} from '@/firebase/firestore'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

import { ScrollArea } from '../ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { NumberInput } from '../ui/number-input'
import { SeatingPlan } from './seatingPlan'
import { Checkbox } from '../ui/checkbox'
import { ExpandableTabs } from '../ui/expandable-tabs-vanilla'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
import SplashScreen from '../splashscreen'

export type FoodItemProps = {
  foodId: string
  foodName: string
  foodPrice: number
  foodCategory: string
  foodPhoto: File | string | null
}

type CartItem = Omit<FoodItemProps, 'foodPhoto'> & {
  qty: number
}

export const validationSchema = Yup.object({
  foodName: Yup.string().required('Required'),
  foodCategory: Yup.string().required('Required'),
  foodPrice: Yup.number().required('Required'),
  foodPhoto: Yup.mixed().nullable(),
})

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
          to="/home/editMenu"
          className="min-w-full"
        />
      </div>
    </>
  )
}

export function editMenu() {
  const { userAdditional } = useFirebaseAuth()

  const { category } = editMenuRoute.useSearch()

  const [foods, setFoods] = useState<FoodItemProps[]>([])
  const [selectedTable, setSelectedTable] = useState<number>(-1)

  const [addToCart, setAddToCart] = useState<{
    items: CartItem[]
    discountRate: number
    taxRate: number
    tableNumber: number
    complementary: boolean
    remarks: string
    status:
      | 'pending'
      | 'ready_to_serve'
      | 'ready_to_pay'
      | 'paid'
      | 'cancelled'
      | 'dismissed'
  }>({
    items: [],
    discountRate: 0,
    taxRate: 0,
    tableNumber: -1,
    complementary: false,
    remarks: '',
    status: 'pending', // Default status
  })
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<FoodItemProps[]>({
    queryKey: ['foods'],
    queryFn: getFoodItems,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    if (data) {
      setFoods(data)
    }
  }, [data])

  const handleAddToCart = (food: FoodItemProps) => {
    setAddToCart((prev) => {
      const existing = prev.items.find(
        (item) => item.foodName === food.foodName,
      )
      let updatedItems

      if (existing) {
        updatedItems = prev.items.map((item) =>
          item.foodName === food.foodName
            ? { ...item, qty: item.qty + 1 }
            : item,
        )
      } else {
        updatedItems = [...prev.items, { ...food, qty: 1 }]
      }

      return {
        ...prev,
        items: updatedItems,
      }
    })
  }

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <div className="">
      <div className="w-full">
        <div className="right-4 bottom-40 z-50 fixed flex justify-center items-center bg-white/40 hover:bg-white/60 dark:bg-black/40 dark:hover:bg-black/60 shadow-xl backdrop-blur-md border border-white/30 dark:border-white/20 rounded-full w-10 h-10 text-gray-800 dark:text-white align-middle">
          <RotateCwIcon
            className="text-rose-600 dark:text-white"
            onClick={() => {
              setAddToCart({
                items: [],
                discountRate: 0,
                taxRate: 0,
                tableNumber: -1,
                complementary: false,
                remarks: '',
                status: 'pending', // Reset status
              })
              setSelectedTable(-1)
            }}
          />
        </div>
        <CreateOrderDrawer
          addToCart={addToCart}
          setAddToCart={setAddToCart}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
        />

        {userAdditional?.role !== 'employee' && <AddDrawer />}
      </div>
      <CategoryTabs />
      {/*  Search Input */}
      <div className="">
        <div className="relative py-1">
          <SearchIcon className="top-1/2 left-4 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-none"
          />
        </div>
      </div>
      <div className="gap-0 grid grid-cols-1">
        {/* filter will disregard category and show it all */}
        {search !== '' && (
          <p className="mb-2 ml-4 text-gray-500 text-xs italic">
            Showing results across all categories
          </p>
        )}

        {foods
          .filter((food) =>
            search === ''
              ? food.foodCategory === category
              : food.foodName.toLowerCase().includes(search.toLowerCase()),
          )
          .sort((a, b) => a.foodName.localeCompare(b.foodName)).length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
            <GhostIcon className="mb-2 w-10 h-10" />
            <span className="text-sm">No items found</span>
          </div>
        ) : (
          foods
            .filter((food) =>
              search === ''
                ? food.foodCategory === category
                : food.foodName.toLowerCase().includes(search.toLowerCase()),
            )
            .sort((a, b) => a.foodName.localeCompare(b.foodName))
            .map((food) => (
              <AnimatePresence key={food.foodId}>
                <motion.div layout>
                  <MenuCard food={food} handleAddToCart={handleAddToCart} />
                </motion.div>
              </AnimatePresence>
            ))
        )}
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
  creditor?: string | null // Optional creditor field
  status:
    | 'pending'
    | 'ready_to_serve'
    | 'ready_to_pay'
    | 'paid'
    | 'cancelled'
    | 'dismissed'
}

type BillProps = {
  addToCart: AddToCart
  setAddToCart: React.Dispatch<React.SetStateAction<AddToCart>>
}

function CreateOrderDrawer({
  addToCart,
  setAddToCart,
  selectedTable,
  setSelectedTable,
}: BillProps & {
  selectedTable: number
  setSelectedTable: (tableNo: number) => void
}) {
  const [open, setOpen] = useState<boolean>(false)
  const [step, setStep] = useState<boolean>(false)
  const queryClient = useQueryClient()
  const enterOrderMutation = useMutation({
    mutationFn: createOrderDocument,
    onSuccess: async () => {
      toast.success('Order placed successfully!')
      setAddToCart({
        items: [],
        discountRate: 0,
        taxRate: 0,
        tableNumber: -1,
        complementary: false,
        creditor: null, // Reset creditor
        remarks: '',
        status: 'pending',
      })
      setSelectedTable(-1)
      setStep(false)
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['getAllOrders'] })
      // --- Send FCM notification to kitchen department ---
      try {
        const tokensWithUid = await getKitchenDepartmentFcmTokens()
        const tokensOnly = tokensWithUid.map((t) => t.token)

        if (tokensWithUid.length > 0) {
          // await fetch('https://fcm-production-8994.up.railway.app/send-fcm', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ tokens }),
          // })
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
      toast.error(`Error: ${error.message}`)
    },
  })

  const handleSelectedTable = (tableNo: number) => {
    setSelectedTable(tableNo)
    setAddToCart((prev) => ({
      ...prev,
      tableNumber: tableNo,
    }))
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
    >
      <DrawerTrigger className="right-4 bottom-28 z-50 fixed flex justify-center items-center bg-white/40 hover:bg-white/60 dark:bg-black/40 dark:hover:bg-black/60 shadow-xl backdrop-blur-md border border-white/30 dark:border-white/20 rounded-full w-10 h-10 text-gray-800 dark:text-white align-middle">
        <>
          <span
            className={cn(
              'absolute -top-1 -right-1 bg-red-600 h-5 w-5 text-white rounded-full p-1 text-xs font-medium flex items-center justify-center transition-opacity',
              {
                'opacity-0':
                  addToCart.items.reduce((sum, item) => sum + item.qty, 0) ===
                  0,
                'opacity-100':
                  addToCart.items.reduce((sum, item) => sum + item.qty, 0) > 0,
              },
            )}
          >
            {addToCart.items.reduce((sum, item) => sum + item.qty, 0)}
          </span>
          <NotebookPenIcon className="text-rose-600 dark:text-white" />
        </>
      </DrawerTrigger>
      <TransitioningDrawerContent>
        <DrawerHeader>
          <div className="flex md:flex-row flex-col md:justify-center lg:justify-center items-center gap-4 p-2">
            <div className="flex items-center gap-4">
              <img
                src={CakeCafeLogo}
                width="48"
                height="48"
                alt="Company Logo"
                className="rounded-md"
              />
              <div className="gap-2 grid">
                <DrawerTitle className="font-bold text-xl">
                  Cake Cafe<sup className="text-[12px]">TM</sup>
                </DrawerTitle>
                <DrawerDescription className="text-gray-500 dark:text-gray-400 text-sm">
                  Jwalakhel-8, Pokhara
                  <br />
                  Phone: +061-531234
                  <br />
                  Email: info@CakeCafe.com.np
                </DrawerDescription>
              </div>
            </div>
          </div>
        </DrawerHeader>
        {step === false ? (
          <motion.div
            layout
            key="seating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SeatingPlan
              selectedTable={selectedTable}
              setSelectedTable={handleSelectedTable}
            />
          </motion.div>
        ) : (
          <motion.div
            layout
            key="bill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Bill addToCart={addToCart} setAddToCart={setAddToCart} />
          </motion.div>
        )}

        <DrawerFooter>
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
            disabled={
              !step ||
              enterOrderMutation.isPending ||
              addToCart.items.length === 0
            }
            onClick={() => {
              // console.log("Order Details:", addToCart);
              enterOrderMutation.mutate(addToCart)
            }}
          >
            {enterOrderMutation.isPending ? (
              <span className="flex items-center gap-2">
                <LoaderIcon className="animate-spin" color="white" />
                Saving...
              </span>
            ) : (
              'Submit'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </TransitioningDrawerContent>
    </Drawer>
  )
}

function Bill({ addToCart, setAddToCart }: BillProps) {
  const updateQty = (foodId: string, newQty: number) => {
    setAddToCart((prev) => ({
      ...prev,
      items:
        newQty > 0
          ? prev.items.map((item) =>
              item.foodId === foodId ? { ...item, qty: newQty } : item,
            )
          : prev.items.filter((item) => item.foodId !== foodId),
    }))
  }

  const [discountRate, setDiscountRate] = useState(addToCart.discountRate) // default 0%
  const [taxRate, setTaxRate] = useState(addToCart.taxRate) // default 0%

  const subtotal = addToCart.items.reduce(
    (sum, item) => sum + item.foodPrice * item.qty,
    0,
  )
  const discountAmount = subtotal * (discountRate / 100)
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
  const total = subtotal - discountAmount + taxAmount

  const { user, userAdditional } = useFirebaseAuth()

  const { data: creditors = [] } = useQuery({
    queryKey: ['creditors'],
    queryFn: getAllCreditors,
  })

  return (
    <div className="mx-auto w-full print:max-w-[300px] max-w-sm font-mono print:text-xs text-sm">
      <div className="bg-white dark:bg-black p-4 border border-border">
        <h2 className="mb-4 font-bold text-center">Receipt Preview</h2>
        <ScrollArea className="h-84">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Item</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addToCart.items.map((item) => (
                <TableRow key={item.foodId}>
                  <TableCell>{item.foodName}</TableCell>
                  <TableCell className="text-center">
                    <NumberInput
                      value={item.qty}
                      onValueChange={(val = 0) =>
                        updateQty(item.foodId, val ?? 0)
                      }
                      className="px-1 py-0 w-12 h-8 text-center"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    Rs.{(item.qty * item.foodPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell colSpan={2} className="font-semibold text-right">
                  Sub Total
                </TableCell>
                <TableCell className="font-bold text-right">
                  Rs.{subtotal.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2} className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <span className="whitespace-nowrap">Discount</span>
                    <NumberInput
                      min={0}
                      max={100}
                      value={discountRate}
                      onValueChange={(val = 0) => {
                        setDiscountRate(val)
                        setAddToCart((prev) => ({
                          ...prev,
                          discountRate: val, // Update the discount rate for the entire cart
                        }))
                      }}
                      className="px-1 py-0 w-14 h-8 text-center"
                    />
                    <span>%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-nowrap">
                  - Rs.{discountAmount.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2} className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <span className="whitespace-nowrap">Tax</span>
                    <NumberInput
                      min={0}
                      max={100}
                      value={taxRate}
                      onValueChange={(val = 0) => {
                        setTaxRate(val)
                        setAddToCart((prev) => ({
                          ...prev,
                          taxRate: val, // Update the tax rate for the entire cart
                        }))
                      }}
                      className="px-1 py-0 w-14 h-8 text-center"
                    />
                    <span>%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-nowrap">
                  + Rs.{taxAmount.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-gray-500 text-xs text-left">
                  Processed By: {userAdditional?.firstName || user?.displayName}
                  <br />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="complementary"
                      onCheckedChange={(checked) => {
                        setAddToCart((prev) => ({
                          ...prev,
                          complementary: !!checked,
                        }))
                      }}
                    />
                    <Label
                      htmlFor="complementary"
                      className="peer-disabled:opacity-70 font-medium text-sm leading-none peer-disabled:cursor-not-allowed"
                    >
                      Complementary
                    </Label>
                  </div>
                </TableCell>

                <TableCell className="font-semibold text-right">
                  Total
                </TableCell>
                <TableCell className="font-bold text-right">
                  Rs.{total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="px-4 py-2">
            <Input
              type="text"
              placeholder="Remarks"
              value={addToCart.remarks}
              onChange={(e) => {
                setAddToCart((prev) => ({
                  ...prev,
                  remarks: e.target.value,
                }))
              }}
              className=""
            />
          </div>
          <div className="px-4 py-2">
            <Label htmlFor="creditor" className="block mb-1">
              Select Creditor (optional)
            </Label>
            <Select
              value={addToCart.creditor || ''}
              onValueChange={(value) => {
                setAddToCart((prev) => ({
                  ...prev,
                  creditor: value,
                }))
              }}
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
        </ScrollArea>
      </div>
    </div>
  )
}

function AddDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const enterFoodItemsMutation = useMutation({
    mutationFn: async (values: Omit<FoodItemProps, 'foodId'>) => {
      const foodId = Math.random().toString(16).slice(2)
      const valuesWithId: FoodItemProps = { ...values, foodId }

      const photoFile: File | null = valuesWithId.foodPhoto as File | null
      let storageURL = null
      if (photoFile !== null) {
        storageURL = await uploadMenuItemImage(foodId, photoFile)
      }

      const valuesWithPhotoURL = {
        ...valuesWithId,
        foodPhoto: storageURL,
      }

      await enterFoodItem(valuesWithPhotoURL)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      toast('Food Item Added successfully!')
      setOpen(false)
    },
    onError: (error: any) => {
      toast('error!', error)
    },
  })

  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <div className="right-4 bottom-16 z-50 fixed flex justify-center items-center bg-white/40 hover:bg-white/60 dark:bg-black/40 dark:hover:bg-black/60 shadow-xl backdrop-blur-md border border-white/30 dark:border-white/20 rounded-full w-10 h-10 text-gray-800 dark:text-white align-middle">
          <PlusIcon className="text-rose-600 dark:text-white" />
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Food Item</DrawerTitle>
          <DrawerDescription>
            Add a new food item here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={{
            foodName: '',
            foodCategory: '',
            foodPrice: 0,
            foodPhoto: null,
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            enterFoodItemsMutation.mutate(values)
          }}
        >
          {(formik) => (
            <Form>
              <div className="gap-4 grid py-4">
                {/* Name Field */}
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodName" className="text-right">
                    Food Name
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodName && formik.errors.foodName && (
                      <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodName}
                      </div>
                    )}
                    <Input
                      id="foodName"
                      name="foodName"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.foodName}
                    />
                  </div>
                </div>

                {/* Category Select */}
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodCategory" className="text-right">
                    Category
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodCategory &&
                      formik.errors.foodCategory && (
                        <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                          {formik.errors.foodCategory}
                        </div>
                      )}
                    <Select
                      name="foodCategory"
                      onValueChange={(value) =>
                        formik.setFieldValue('foodCategory', value)
                      }
                      value={formik.values.foodCategory}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appetizers">Appetizers</SelectItem>
                        <SelectItem value="main_courses">
                          Main Course
                        </SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="desserts">Dessert</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="hard_drinks">Hard Drinks</SelectItem>
                        <SelectItem value="specials">Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Field */}
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodPrice" className="text-right">
                    Price
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodPrice && formik.errors.foodPrice && (
                      <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodPrice}
                      </div>
                    )}
                    <Input
                      id="foodPrice"
                      name="foodPrice"
                      type="number"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.foodPrice}
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodPhoto" className="text-right">
                    Photo
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodPhoto && formik.errors.foodPhoto && (
                      <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodPhoto}
                      </div>
                    )}
                    <Input
                      type="file"
                      id="foodPhoto"
                      name="foodPhoto"
                      className="w-full"
                      onChange={(event) => {
                        formik.setFieldValue(
                          'foodPhoto',
                          event.currentTarget.files?.[0] || '',
                        )
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <Button
                  className="text-white"
                  type="submit"
                  disabled={enterFoodItemsMutation.isPending} // Disable button if loading
                >
                  {enterFoodItemsMutation.isPending ? (
                    <LoaderIcon className="animate-spin" color="white" />
                  ) : (
                    'Submit'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </Form>
          )}
        </Formik>
      </DrawerContent>
    </Drawer>
  )
}
