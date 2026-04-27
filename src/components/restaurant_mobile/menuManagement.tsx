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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DonutImage from '@/assets/donutImage'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { SplashScreen } from '@/components/splashscreen'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import { useRouteContext, useSearch } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { pb } from '@/lib/pocketbase'
import {
  menuItemsQuery,
  MAIN_CATEGORIES,
  type MenuItemProps,
  type MainCategory,
} from '@/lib/pocketbase/menuManagement'

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
        {menuItems.map((menuItem) => (
          <div
            key={menuItem.id}
            className="flex items-center gap-3 active:bg-accent p-4 border rounded-xl transition-colors"
          >
            <div className="flex justify-center items-center bg-gray-100 rounded-lg w-16 h-16">
              {menuItem.photoURL ? (
                <img
                  alt={menuItem.name}
                  src={pb.files.getURL(menuItem, menuItem.photoURL)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <DonutImage />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{menuItem.name}</h3>
              <p className="text-muted-foreground text-sm">
                Rs. {menuItem.price}
              </p>
            </div>
            {/* Edit and Delete Buttons */}
            <div className="flex gap-2">
              <EditMenuItemDrawer menuItem={menuItem} />
              <DeleteMenuItemDrawer menuItem={menuItem} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// Validation schema for menu item form
const menuItemValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Too short')
    .max(64, 'Too long')
    .required('Required'),
  mainCategory: Yup.string()
    .oneOf([...MAIN_CATEGORIES], 'Invalid Category') // Uses your constant
    .required('Required'),
  price: Yup.number()
    .typeError('Must be a number')
    .min(1, 'Must be greater than 0')
    .required('Required'),
  type: Yup.string().nullable(),
  photoURL: Yup.mixed().nullable(),
})

interface MenuItemAddValues {
  name: string
  mainCategory: MainCategory
  price: number
  type?: string
  photoURL?: File | string
}

export function AddMenuItemDrawer() {
  const { auth } = useRouteContext({ from: '/home' })
  const user = auth.user!
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const enterMenuItemMutation = useMutation({
    mutationFn: async (values: MenuItemAddValues) => {
      const formData = new FormData()

      // 1. Append all text fields
      formData.append('name', values.name)
      formData.append('price', values.price.toString())
      formData.append('mainCategory', values.mainCategory)
      formData.append('editedBy', user.id)
      formData.append('addedBy', user.id)

      if (values.type) formData.append('type', values.type)

      // 2. Append the file (PocketBase handles the rest)
      if (values.photoURL instanceof File) {
        formData.append('photoURL', values.photoURL)
      }

      // 3. Single request to Create
      return await pb.collection('menuItems').create(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      toast.success('Menu Item Added successfully!')
      setOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error adding item: ' + error.message)
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

        <Formik<MenuItemAddValues>
          initialValues={{
            name: '',
            mainCategory: 'appetizers',
            price: 0,
            type: undefined,
            photoURL: undefined,
          }}
          validationSchema={menuItemValidationSchema}
          onSubmit={(values) => {
            const normalizedValues = {
              ...values,
              type: values.type ? values.type.toLowerCase() : undefined,
            }
            enterMenuItemMutation.mutate(normalizedValues)
          }}
        >
          {(formik) => (
            <Form>
              <ScrollArea className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {/* Name Field */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Menu Item Name</Label>
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
                        {String(formik.errors.name)}
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
                        {MAIN_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {/* Replaces underscores with spaces and capitalizes for the UI */}
                            {cat.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.mainCategory &&
                      formik.errors.mainCategory && (
                        <div className="text-red-500 text-xs">
                          {String(formik.errors.mainCategory)}
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
                        {String(formik.errors.price)}
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

interface MenuItemEditValues {
  id: string
  name: string
  mainCategory: MainCategory
  price: number
  type?: string
  photoURL?: File | string
}

// Edit Menu Item Drawer Component
function EditMenuItemDrawer({ menuItem }: { menuItem: MenuItemProps }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { auth } = useRouteContext({ from: '/home' })
  const user = auth.user!

  const updateMenuItemsMutation = useMutation({
    mutationFn: async (values: MenuItemEditValues) => {
      const formData = new FormData()

      // 1. Append Text Fields
      formData.append('name', values.name)
      formData.append('price', values.price.toString())
      formData.append('mainCategory', values.mainCategory)
      formData.append('type', values.type ?? '')
      formData.append('editedBy', user.id)

      // 2. Handle Image
      // Only append if the user actually picked a NEW file
      if (values.photoURL instanceof File) {
        formData.append('photoURL', values.photoURL)
      }

      // 3. Single Update Request
      return await pb.collection('menuItems').update(values.id, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      toast.success('Item updated successfully!')
      setOpen(false)
    },
    onError: (error: any) => {
      toast.error('Update failed: ' + error.message)
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
          <SheetTitle>Edit Menu Item</SheetTitle>
          <SheetDescription>
            Update the details of {menuItem.name}. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <Formik<MenuItemEditValues>
          initialValues={{
            id: menuItem.id,
            name: menuItem.name,
            mainCategory: menuItem.mainCategory,
            price: menuItem.price,
            type: menuItem.type ?? undefined,
            photoURL: menuItem.photoURL ?? undefined,
          }}
          validationSchema={menuItemValidationSchema}
          onSubmit={(values) => updateMenuItemsMutation.mutate(values)}
        >
          {(formik) => (
            <Form>
              <ScrollArea className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Menu Item Name</Label>
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
                        {MAIN_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {/* Replaces underscores with spaces and capitalizes for the UI */}
                            {cat.replace('_', ' ').toUpperCase()}
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

// Delete Menu Item Drawer Component
function DeleteMenuItemDrawer({ menuItem }: { menuItem: MenuItemProps }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMenuItemMutation = useMutation({
    mutationFn: async () => {
      // PocketBase handles deleting the associated photoURL file automatically
      await pb.collection('menuItems').delete(menuItem.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      toast.success('Menu Item Deleted successfully!')
      setOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error deleting item: ' + error.message)
    },
  })

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Menu Item</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete <strong>{menuItem.name}</strong>?
            This action cannot be undone.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <div className="bg-card p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-gray-100 rounded-lg w-12 h-12">
                {typeof menuItem.photoURL === 'string' && menuItem.photoURL ? (
                  <img
                    alt={menuItem.name}
                    src={pb.files.getURL(menuItem, menuItem.photoURL)}
                    className="rounded-lg w-12 h-12 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <DonutImage width={36} height={36} />
                )}
              </div>
              <div>
                <h4 className="font-medium">{menuItem.name}</h4>
                <p className="text-muted-foreground text-sm">
                  Rs. {menuItem.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={() => deleteMenuItemMutation.mutate()}
            disabled={deleteMenuItemMutation.isPending}
          >
            {deleteMenuItemMutation.isPending ? (
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
  const { data: menuItems = [], isLoading } = useQuery(menuItemsQuery())

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
              viewTransition={{ types: ['slide-left'] }}
              className="inline-flex items-center gap-1 p-2 border rounded-lg text-muted-foreground hover:text-primary transition-colors"
              title="Go to Inventory"
            >
              <PartyPopperIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Go To Inventory</span>
            </Link>
            <AddMenuItemDrawer />
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
              <span className="mt-1 text-[10px] tiny:text-xs">
                Try a different search term or add a new item using the + button
              </span>
            </div>
          )}
      </div>
    </div>
  )
}
