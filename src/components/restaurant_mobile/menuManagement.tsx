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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
  PlusIcon,
  MinusIcon,
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
} from '@/firebase/firestore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DonutImage from '@/assets/donutImage'
import { Formik, Form, FieldArray } from 'formik'
import * as Yup from 'yup'
import SplashScreen from '@/components/splashscreen'
import { uploadMenuItemImage } from '@/firebase/firebase_storage'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import { useSearch } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

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

export type SubcategoryOption = {
  id: string
  name: string
  price: number
}

export type FoodItemProps = {
  foodId?: string // optional for form usage
  foodName: string
  foodPrice: number
  foodCategory: string
  foodPhoto: File | string | null
  subcategories: SubcategoryOption[]
  hasSubcategories: boolean
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
          to="/home/menuManagement"
          className="min-w-full"
        />
      </div>
    </>
  )
}

// Menu Item Card Component
const MenuItemCard = memo(function MenuItemCard({
  food,
}: {
  food: FoodItemProps
}) {
  return (
    <div className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-muted py-2 pr-2 border-b transition-colors">
      <div className="flex justify-center items-center border-red-500 rounded-lg w-16 h-16">
        {typeof food.foodPhoto === 'string' && food.foodPhoto ? (
          <img
            alt={food.foodName}
            src={food.foodPhoto}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <DonutImage />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium">{food.foodName}</h3>
          {food.hasSubcategories && (
            <Badge variant="secondary" className="text-xs">
              {food.subcategories?.length} Options
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {food.hasSubcategories
            ? `From Rs. ${food.foodPrice}`
            : `Rs. ${food.foodPrice}`}
        </p>
        {food.hasSubcategories && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(food.subcategories ?? []).slice(0, 3).map((sub) => (
              <span
                key={sub.id}
                className="bg-card px-2 py-1 rounded text-card-foreground text-xs"
              >
                {sub.name}
              </span>
            ))}
            {food.subcategories && food.subcategories.length > 3 && (
              <span className="text-muted-foreground text-xs">
                +{food.subcategories.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <EditFoodDrawer food={food} />
        <DeleteFoodDrawer food={food} />
      </div>
    </div>
  )
})
// Validation schema for food form
const foodValidationSchema = Yup.object({
  foodName: Yup.string()
    .trim()
    .min(2, 'Too short')
    .max(64, 'Too long')
    .required('Required'),
  foodPrice: Yup.number()
    .typeError('Must be a number')
    .min(1, 'Must be greater than 0')
    .required('Required'),
  foodCategory: Yup.string()
    .oneOf(
      categories.map((cat) => cat.id),
      'Invalid',
    )
    .required('Required'),
  hasSubcategories: Yup.boolean().required(),
  subcategories: Yup.array()
    .of(
      Yup.object({
        id: Yup.string().required(),
        name: Yup.string()
          .trim()
          .min(1, 'Required')
          .max(64, 'Too long')
          .required('Required'),
        price: Yup.number()
          .typeError('Must be a number')
          .min(0, 'Must be >= 0')
          .required('Required'),
      }),
    )
    .when('hasSubcategories', {
      is: true,
      then: (schema) => schema.min(1, 'At least one subcategory required'),
      otherwise: (schema) => schema.max(0),
    }),
})

export function AddFoodDrawer() {
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
      shouldScaleBackground
      setBackgroundColorOnScale
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

        <Formik<FoodItemProps>
          initialValues={{
            foodName: '',
            foodCategory: '',
            foodPrice: 0,
            foodPhoto: null,
            hasSubcategories: false,
            subcategories: [],
          }}
          validationSchema={foodValidationSchema}
          onSubmit={(values) => {
            enterFoodItemsMutation.mutate(values)
          }}
        >
          {(formik) => (
            <Form>
              <ScrollArea className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {/* Name Field */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodName">Food Name</Label>
                    <div className="relative">
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodCategory">Category</Label>
                    <div className="relative">
                      {formik.touched.foodCategory &&
                        formik.errors.foodCategory && (
                          <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                            {formik.errors.foodCategory}
                          </div>
                        )}
                      <Select
                        name="foodCategory"
                        value={formik.values.foodCategory}
                        onValueChange={(value) =>
                          formik.setFieldValue('foodCategory', value)
                        }
                      >
                        <SelectTrigger className="w-full">
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
                          <SelectItem value="hard_drinks">
                            Hard Drinks
                          </SelectItem>
                          <SelectItem value="specials">Specials</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price Field */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodPrice">Base Price</Label>
                    <div className="relative">
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodPhoto">Photo</Label>
                    <div className="relative">
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
                        onChange={(e) => {
                          formik.setFieldValue(
                            'foodPhoto',
                            e.currentTarget.files?.[0] || null,
                          )
                        }}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                  </div>

                  {/* Has Subcategories Checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hasSubcategories"
                      checked={formik.values.hasSubcategories}
                      onCheckedChange={(checked) =>
                        formik.setFieldValue('hasSubcategories', !!checked)
                      }
                    />
                    <Label htmlFor="hasSubcategories" className="select-none">
                      Has Subcategories?
                    </Label>
                  </div>

                  {/* Subcategories List */}
                  {formik.values.hasSubcategories && (
                    <FieldArray name="subcategories">
                      {({ push, remove }) => (
                        <div className="flex flex-col gap-3">
                          {formik.values.subcategories.map((_, index) => (
                            <div
                              key={index}
                              className="flex gap-2 bg-muted/20 p-2 rounded"
                            >
                              {/* Name */}
                              <div className="flex-1">
                                <Input
                                  name={`subcategories.${index}.name`}
                                  placeholder="Subcategory Name"
                                  value={
                                    formik.values.subcategories[index].name
                                  }
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                />
                                {typeof formik.errors.subcategories?.[index] ===
                                  'object' &&
                                  formik.errors.subcategories?.[index] !==
                                    null &&
                                  'name' in
                                    (formik.errors.subcategories[
                                      index
                                    ] as object) &&
                                  formik.touched.subcategories?.[index]
                                    ?.name && (
                                    <p className="mt-1 text-red-500 text-xs">
                                      {
                                        (
                                          formik.errors.subcategories[
                                            index
                                          ] as { name?: string }
                                        ).name
                                      }
                                    </p>
                                  )}
                              </div>

                              {/* Price */}
                              <div className="w-24">
                                <Input
                                  name={`subcategories.${index}.price`}
                                  type="number"
                                  placeholder="Price"
                                  value={
                                    formik.values.subcategories[index].price
                                  }
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                />
                                {typeof formik.errors.subcategories?.[index] ===
                                  'object' &&
                                  formik.errors.subcategories?.[index] !==
                                    null &&
                                  'price' in
                                    (formik.errors.subcategories[
                                      index
                                    ] as object) &&
                                  formik.touched.subcategories?.[index]
                                    ?.price && (
                                    <p className="mt-1 text-red-500 text-xs">
                                      {
                                        (
                                          formik.errors.subcategories[
                                            index
                                          ] as { price?: string }
                                        ).price
                                      }
                                    </p>
                                  )}
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => remove(index)}
                                size="sm"
                                className="flex justify-center items-center p-0 w-8 h-8"
                                aria-label="Remove subcategory"
                              >
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}

                          {/* Add Subcategory Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex items-center gap-2"
                            onClick={() =>
                              push({
                                id: Math.random().toString(16).slice(2),
                                name: '',
                                price: 0,
                              })
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Subcategory
                          </Button>
                        </div>
                      )}
                    </FieldArray>
                  )}
                </div>
              </ScrollArea>

              <DrawerFooter>
                <Button
                  className="text-white"
                  type="submit"
                  disabled={enterFoodItemsMutation.isPending}
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

// Edit Food Drawer Component
function EditFoodDrawer({ food }: { food: FoodItemProps }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const updateFoodItemsMutation = useMutation({
    mutationFn: async (values: FoodItemProps) => {
      const photoFile: File | null = values.foodPhoto as File | null

      let storageURL = null
      if (photoFile !== null) {
        storageURL = await uploadMenuItemImage(values.foodId!, photoFile)
      }

      const valuesWithPhotoURL = {
        ...values,
        foodPhoto: storageURL || values.foodPhoto,
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
    <Drawer
      shouldScaleBackground
      setBackgroundColorOnScale
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Food Item</DrawerTitle>
          <DrawerDescription>
            Update the details of {food.foodName}. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>

        <Formik<FoodItemProps>
          initialValues={food}
          validationSchema={foodValidationSchema}
          onSubmit={(values) => {
            updateFoodItemsMutation.mutate(values)
          }}
        >
          {(formik) => (
            <Form>
              <ScrollArea className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {/* Food Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodName">Food Name</Label>
                    <Input
                      id="foodName"
                      name="foodName"
                      type="text"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.foodName}
                    />
                  </div>

                  {/* Food Category */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodCategory">Category</Label>
                    <Select
                      name="foodCategory"
                      value={formik.values.foodCategory}
                      onValueChange={(value) =>
                        formik.setFieldValue('foodCategory', value)
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

                  {/* Food Price */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodPrice">Base Price</Label>
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

                  {/* File Upload */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foodPhoto">Photo</Label>
                    <Input
                      type="file"
                      id="foodPhoto"
                      name="foodPhoto"
                      className="w-full"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        formik.setFieldValue('foodPhoto', file)
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </div>

                  {/* Has Subcategories Checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hasSubcategories"
                      checked={formik.values.hasSubcategories}
                      onCheckedChange={(checked) =>
                        formik.setFieldValue('hasSubcategories', !!checked)
                      }
                    />
                    <Label htmlFor="hasSubcategories" className="select-none">
                      Has Subcategories?
                    </Label>
                  </div>

                  {/* Subcategories List */}
                  {formik.values.hasSubcategories && (
                    <FieldArray name="subcategories">
                      {({ push, remove }) => (
                        <div className="flex flex-col gap-3">
                          {formik.values.subcategories.map((sub, index) => (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2 bg-gray-50 dark:bg-muted/40 px-2 py-2 border border-gray-200 dark:border-muted-foreground/20 rounded-md"
                            >
                              <div className="flex flex-col flex-1 gap-1">
                                <Label className="block mb-1 text-muted-foreground text-xs">
                                  Option Name
                                </Label>
                                <Input
                                  name={`subcategories.${index}.name`}
                                  placeholder="Option name"
                                  value={sub.name}
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      `subcategories.${index}.name`,
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="flex flex-col gap-1 w-24">
                                <Label className="block mb-1 text-muted-foreground text-xs">
                                  Price
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Price"
                                  value={sub.price}
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      `subcategories.${index}.price`,
                                      Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <MinusIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="secondary"
                            className="flex items-center gap-2"
                            onClick={() =>
                              push({
                                id: Math.random().toString(16).slice(2),
                                name: '',
                                price: 0,
                              })
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Subcategory
                          </Button>
                        </div>
                      )}
                    </FieldArray>
                  )}
                </div>
              </ScrollArea>

              <DrawerFooter>
                <Button
                  className="text-white"
                  type="submit"
                  disabled={updateFoodItemsMutation.isPending}
                >
                  {updateFoodItemsMutation.isPending ? (
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

// Delete Food Drawer Component
function DeleteFoodDrawer({ food }: { food: FoodItemProps }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteFoodItemMutation = useMutation({
    mutationFn: async () => {
      await deleteFoodItem(food.foodId!)
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
            Are you sure you want to delete <strong>{food.foodName}</strong>?
            This action cannot be undone.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <div className="bg-card p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-gray-100 rounded-lg w-12 h-12">
                {typeof food.foodPhoto === 'string' && food.foodPhoto ? (
                  <img
                    alt={food.foodName}
                    src={food.foodPhoto}
                    className="rounded-lg w-12 h-12 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <DonutImage width={36} height={36} />
                )}
              </div>
              <div>
                <h4 className="font-medium">{food.foodName}</h4>
                <p className="text-muted-foreground text-sm">
                  Rs. {food.foodPrice}
                </p>
                {food.hasSubcategories && (
                  <p className="text-muted-foreground text-xs">
                    Has {food.subcategories?.length} subcategories
                  </p>
                )}
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
                <LoaderIcon className="mr-2 w-4 h-4 animate-spin" />
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
    <div className="bg-background h-full">
      {/* Header */}
      <div className="top-0 z-50 sticky bg-transparent backdrop-blur border-b">
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
        </div>

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

      {/* Menu Items List */}
      <div className="pb-32">
        <div className="space-y-0">
          {foods
            .filter((food) => {
              if (search.trim()) {
                const searchLower = search.toLowerCase()
                // Search in food name, category, and subcategory names
                const inName = food.foodName.toLowerCase().includes(searchLower)
                const inCategory = food.foodCategory
                  .toLowerCase()
                  .includes(searchLower)
                const inSubcategory = (food.subcategories || []).some((sub) =>
                  sub.name.toLowerCase().includes(searchLower),
                )
                return inName || inCategory || inSubcategory
              } else {
                // No search: filter by selected category only
                return (
                  selectedCategory === '' ||
                  food.foodCategory === selectedCategory
                )
              }
            })
            .map((food) => (
              <div key={food.foodId}>
                <MenuItemCard food={food} />
              </div>
            ))}
        </div>
        {foods.filter((food) => {
          if (!search.trim()) return false // Only show empty state if search is active and no results
          const searchLower = search.toLowerCase()
          const inName = food.foodName.toLowerCase().includes(searchLower)
          const inCategory = food.foodCategory
            .toLowerCase()
            .includes(searchLower)
          const inSubcategory = (food.subcategories || []).some((sub) =>
            sub.name.toLowerCase().includes(searchLower),
          )
          return inName || inCategory || inSubcategory
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

      <AddFoodDrawer />
    </div>
  )
}
