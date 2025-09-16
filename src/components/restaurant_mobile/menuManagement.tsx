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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
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
  PlusIcon,
  LoaderIcon,
  PencilIcon,
  Trash2Icon,
  SandwichIcon,
  PizzaIcon,
  DonutIcon,
  IceCreamIcon,
  CoffeeIcon,
  BeerIcon,
  SparklesIcon,
  UtensilsCrossedIcon,
  SearchIcon,
  ArrowLeftIcon,
  PartyPopperIcon,
} from 'lucide-react'
import {
  getFoodItems,
  enterFoodItem,
  editFoodItem,
  deleteFoodItem,
  type FoodItemProps,
} from '@/firebase/menuManagement'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DonutImage from '@/assets/donutImage'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import SplashScreen from '@/components/splashscreen'
import { uploadMenuItemImage } from '@/firebase/firebase_storage'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import { useSearch } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'

// Food categories configuration
export const categories = [
  { id: 'main_courses', name: 'Main Courses' },
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'hard_drinks', name: 'Hard Drinks' },
  { id: 'specials', name: 'Specials' },
  { id: 'others', name: 'Others' },
]

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

// Menu Item Card Component
const MenuItemCard = memo(function MenuItemCard({
  foods,
}: {
  foods: FoodItemProps[]
}) {
  // All foods have the same type, so use the first item's type or name as the heading
  const type = foods[0]?.type?.toUpperCase() || foods[0]?.name.toUpperCase()

  return (
    <div className="mb-8 p-4 border rounded-xl">
      <h2 className="mb-3 font-bold text-xl tracking-wide">{type}</h2>
      <div className="flex flex-col gap-2">
        {foods.map((food) => (
          <div
            key={food.foodId}
            className="flex items-center gap-3 active:bg-accent p-4 border rounded-xl transition-colors"
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
              <p className="text-muted-foreground text-sm">Rs. {food.price}</p>
            </div>
            {/* Edit and Delete Buttons */}
            <div className="flex gap-2">
              <EditFoodDrawer food={food} />
              <DeleteFoodDrawer food={food} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// Validation schema for food form
const foodValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Too short')
    .max(64, 'Too long')
    .required('Required'),
  mainCategory: Yup.string()
    .oneOf(
      categories.map((cat) => cat.id),
      'Invalid',
    )
    .required('Required'),
  price: Yup.number()
    .typeError('Must be a number')
    .min(1, 'Must be greater than 0')
    .required('Required'),
  type: Yup.string().nullable(),
  photoURL: Yup.mixed().nullable(),
})

export function AddFoodDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const enterFoodItemsMutation = useMutation({
    mutationFn: async (values: Omit<FoodItemProps, 'foodId'>) => {
      const id = crypto.randomUUID()
      const valuesWithId: FoodItemProps = { ...values, foodId: id }
      const photoFile: File | null = valuesWithId.photoURL as File | null

      let storageURL = null
      if (photoFile !== null) {
        storageURL = await uploadMenuItemImage(id, photoFile)
      }

      const valuesWithPhotoURL = {
        ...valuesWithId,
        photoURL: storageURL,
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon color="white" />
          Add Food Item
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add Food Item</SheetTitle>
          <SheetDescription>
            Add a new food item here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <Formik<Omit<FoodItemProps, 'foodId'>> // id will be generated
          initialValues={{
            name: '',
            mainCategory: 'appetizers',
            price: 0,
            type: null,
            photoURL: null,
          }}
          validationSchema={foodValidationSchema}
          onSubmit={(values) => {
            const normalizedValues = {
              ...values,
              type: values.type ? values.type.toLowerCase() : null,
            }
            enterFoodItemsMutation.mutate(normalizedValues)
          }}
        >
          {(formik) => (
            <Form>
              <ScrollArea className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {/* Name Field */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Food Name</Label>
                    <Input
                      id="name"
                      name="name"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.name}
                    />
                    {formik.touched.name && formik.errors.name && (
                      <div className="text-red-500 text-xs">
                        {formik.errors.name}
                      </div>
                    )}
                  </div>

                  {/* Category Select */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="mainCategory">Category</Label>
                    <Select
                      name="mainCategory"
                      value={formik.values.mainCategory}
                      onValueChange={(value) =>
                        formik.setFieldValue('mainCategory', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.mainCategory &&
                      formik.errors.mainCategory && (
                        <div className="text-red-500 text-xs">
                          {formik.errors.mainCategory}
                        </div>
                      )}
                  </div>

                  {/* Price Field */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.price}
                    />
                    {formik.touched.price && formik.errors.price && (
                      <div className="text-red-500 text-xs">
                        {formik.errors.price}
                      </div>
                    )}
                  </div>

                  {/* Type Field (optional) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">
                      Type (optional): For example, enter "pizza" for Chicken
                      Pizza. Leave blank for items like Plain Water.
                    </Label>
                    <Input
                      id="type"
                      name="type"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.type || ''}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="photoURL">Photo</Label>
                    <Input
                      type="file"
                      id="photoURL"
                      name="photoURL"
                      className="w-full"
                      onChange={(e) => {
                        formik.setFieldValue(
                          'photoURL',
                          e.currentTarget.files?.[0] || null,
                        )
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter>
                <Button
                  className="text-white"
                  type="submit"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? (
                    <LoaderIcon color="white" className="animate-spin" />
                  ) : (
                    'Submit'
                  )}
                </Button>
                <SheetClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </SheetClose>
              </SheetFooter>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  )
}

// Edit Food Drawer Component
function EditFoodDrawer({ food }: { food: FoodItemProps }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const updateFoodItemsMutation = useMutation({
    mutationFn: async (
      values: Omit<FoodItemProps, 'foodId'> & { foodId: string },
    ) => {
      const photoFile: File | null = values.photoURL as File | null

      let storageURL = null
      if (photoFile !== null) {
        storageURL = await uploadMenuItemImage(values.foodId, photoFile)
      }

      const valuesWithPhotoURL = {
        ...values,
        type: values.type ?? null, // ensure null
        photoURL: storageURL ?? null, // ensure null if no file uploaded
      }

      await editFoodItem(valuesWithPhotoURL)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      toast('Food Item Updated successfully!')
      setOpen(false)
    },
    onError: (error: any) => {
      toast('error!', error)
    },
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <PencilIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Edit Food Item</SheetTitle>
          <SheetDescription>
            Update the details of {food.name}. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <Formik<Omit<FoodItemProps, 'foodId'> & { foodId: string }>
          initialValues={{
            foodId: food.foodId,
            name: food.name,
            mainCategory: food.mainCategory,
            price: food.price,
            type: food.type ?? null, // ensure null
            photoURL: food.photoURL ?? null, // ensure null
          }}
          validationSchema={foodValidationSchema}
          onSubmit={(values) => updateFoodItemsMutation.mutate(values)}
        >
          {(formik) => (
            <Form>
              <ScrollArea className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Food Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.name}
                    />
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="mainCategory">Category</Label>
                    <Select
                      name="mainCategory"
                      value={formik.values.mainCategory}
                      onValueChange={(value) =>
                        formik.setFieldValue('mainCategory', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.price}
                    />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">
                      Type (optional): e.g., "pizza" for Chicken Pizza. Leave
                      blank for items like Plain Water.
                    </Label>
                    <Input
                      id="type"
                      name="type"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.type || ''}
                    />
                  </div>

                  {/* Photo */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="photoURL">Photo</Label>
                    <Input
                      type="file"
                      id="photoURL"
                      name="photoURL"
                      className="w-full"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        formik.setFieldValue('photoURL', file)
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter>
                <Button
                  className="text-white"
                  type="submit"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? (
                    <LoaderIcon className="animate-spin" color="white" />
                  ) : (
                    'Submit'
                  )}
                </Button>
                <SheetClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </SheetClose>
              </SheetFooter>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  )
}

// Delete Food Drawer Component
function DeleteFoodDrawer({ food }: { food: FoodItemProps }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteFoodItemMutation = useMutation({
    mutationFn: async () => {
      await deleteFoodItem(food.foodId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      toast('Food Item Deleted successfully!')
      setOpen(false)
    },
    onError: (error: any) => {
      toast('error!', error)
    },
  })

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground
      setBackgroundColorOnScale
    >
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Food Item</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete <strong>{food.name}</strong>? This
            action cannot be undone.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <div className="bg-card p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-gray-100 rounded-lg w-12 h-12">
                {typeof food.photoURL === 'string' && food.photoURL ? (
                  <img
                    alt={food.name}
                    src={food.photoURL}
                    className="rounded-lg w-12 h-12 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <DonutImage width={36} height={36} />
                )}
              </div>
              <div>
                <h4 className="font-medium">{food.name}</h4>
                <p className="text-muted-foreground text-sm">
                  Rs. {food.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={() => deleteFoodItemMutation.mutate()}
            disabled={deleteFoodItemMutation.isPending}
          >
            {deleteFoodItemMutation.isPending ? (
              <>
                <LoaderIcon
                  className="mr-2 w-4 h-4 animate-spin"
                  color="white"
                />
                Deleting...
              </>
            ) : (
              'Yes, Delete Item'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// Main MenuManagement Component
export function MenuManagement() {
  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foods'],
    queryFn: getFoodItems,
  })

  const { category: selectedCategory } = useSearch({
    from: '/home/menuManagement',
  })

  const [search, setSearch] = useState('')

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <div className="flex flex-col bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="top-0 z-50 sticky bg-transparent backdrop-blur">
        <div className="flex justify-between items-center p-4">
          <div>
            <Link
              to="/home/takeOrder"
              search={{ category: 'appetizers' }}
              viewTransition={{ types: ['slide-right'] }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-primary transition-colors"
              title="Go to Orders"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Go To Take Orders</span>
            </Link>

            <h1 className="font-bold text-xl">Menu Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage your restaurant menu items
            </p>
          </div>
          <div className="flex sm:flex-row flex-col items-center gap-2">
            <Link
              to="/home/inventoryManagement"
              search={{ category: 'appetizers' }}
              viewTransition={{ types: ['slide-right'] }}
              className="inline-flex items-center gap-1 p-2 border rounded-lg text-muted-foreground hover:text-primary transition-colors"
              title="Go to Inventory"
            >
              <PartyPopperIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Go To Inventory</span>
            </Link>
            <AddFoodDrawer />
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
          <p className="mb-2 ml-4 text-gray-500 text-xs italic">
            Showing results across all categories
          </p>
        )}
      </div>

      {/* Menu Items List */}
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
                <MenuItemCard foods={foodsOfType} />
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
    </div>
  )
}
