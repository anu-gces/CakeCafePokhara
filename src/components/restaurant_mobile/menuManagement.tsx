import { memo, useState } from 'react'
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
  PackageIcon,
} from 'lucide-react'

import DonutImage from '@/assets/donutImage'
import { SplashScreen } from '@/components/splashscreen'
import { ExpandableTabs } from '@/components/ui/expandable-tabs-vanilla'
import { useSearch } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'

import { Authenticated } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useQuery, useMutation } from 'convex/react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import type { WithoutSystemFields } from 'convex/server'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

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
              <h3 className="font-medium">{menuItem.name}</h3>
              <p className="text-muted-foreground text-sm">
                Rs. {menuItem.price}
              </p>
            </div>
            {/* Edit and Delete Buttons */}
            <div className="flex gap-2">
              <Authenticated>
                <EditMenuItemDrawer key={menuItem._id} menuItem={menuItem} />
                <DeleteMenuItemDrawer menuItem={menuItem} />
              </Authenticated>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// Main MenuManagement Component
export function MenuManagement() {
  const menuItems = useQuery(api.restaurant.menuItems.listMenuItems)
  // const user = useQuery(api.users.currentUser)

  const { category: selectedCategory } = useSearch({
    from: '/home/menuManagement',
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
              <PackageIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Go To Inventory</span>
            </Link>
            <Authenticated>
              <AddMenuItemDrawer />
            </Authenticated>
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

type MenuItem = WithoutSystemFields<Doc<'menuItems'>>

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Must be 0 or more'),
  type: z.string().optional(),
  photoId: z.instanceof(File).optional(),
  mainCategory: z.enum([
    'appetizers',
    'main_courses',
    'bakery',
    'desserts',
    'beverages',
    'hard_drinks',
    'specials',
    'others',
  ]),
})

type MenuItemFormData = Omit<
  MenuItem,
  'stockCount' | 'addedBy' | 'editedBy' | 'photoId' | 'price'
> & {
  photoId?: File
  price: string
}

function AddMenuItemDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const mutateAddItem = useMutation(api.restaurant.menuItems.addMenuItem)
  const generateUploadUrl = useMutation(api.imageUpload.generateUploadUrl)

  const form = useForm({
    defaultValues: {
      name: '',
      price: '',
      type: undefined,
      photoId: undefined,
      mainCategory: 'appetizers',
    } as MenuItemFormData,
    validators: {
      onChange: menuItemSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        let photoId: Id<'_storage'> | undefined = undefined

        if (value.photoId) {
          // value.photoId is the File object stored by your field
          const file = value.photoId as unknown as File

          // Step 1: get short-lived upload URL
          const uploadUrl = await generateUploadUrl()

          // Step 2: POST the raw file to Convex storage
          const res = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
          })

          if (!res.ok) throw new Error('Photo upload failed')

          // Step 3: extract the storageId
          const { storageId } = (await res.json()) as {
            storageId: Id<'_storage'>
          }
          photoId = storageId
        }

        await mutateAddItem({
          name: value.name,
          price: Number(value.price),
          stockCount: 0,
          mainCategory: value.mainCategory,
          type: value.type || undefined,
          photoId,
        })

        form.reset()
        setIsOpen(false)
      } catch (err) {
        console.error('Failed to add menu item:', err)
      }
    },
  })

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon color="white" />
          Add Menu Item
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="p-4">
        <SheetHeader>
          <SheetTitle>Add Menu Item</SheetTitle>
        </SheetHeader>

        <form
          className="flex flex-col gap-5 py-6"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Margherita Pizza"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="price">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Price</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="0.00"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="mainCategory">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as MenuItemFormData['mainCategory'])
                  }
                >
                  <SelectTrigger onBlur={field.handleBlur}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appetizers">Appetizers</SelectItem>
                    <SelectItem value="main_courses">Main Courses</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="hard_drinks">Hard Drinks</SelectItem>
                    <SelectItem value="specials">Specials</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  Type{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value || undefined)
                  }
                  placeholder="use this to categorize. Eg: chicken momo & veg momo if they have type 'momo' they will be grouped together"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="photoId">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.files?.[0] as any)
                  }
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <SheetFooter className="mt-2">
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    'Add Item'
                  )}
                </Button>
              )}
            </form.Subscribe>
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

type EditMenuItemDrawerProps = {
  menuItem: MenuItemProps
}

function EditMenuItemDrawer({ menuItem }: EditMenuItemDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const mutateEditItem = useMutation(api.restaurant.menuItems.editMenuItem)

  const form = useForm({
    defaultValues: {
      name: menuItem.name,
      price: String(menuItem.price),
      type: menuItem.type ?? undefined,
      mainCategory: menuItem.mainCategory,
    } as Omit<MenuItemFormData, 'photoId'>,
    validators: {
      onChange: menuItemSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutateEditItem({
          id: menuItem._id,
          name: value.name,
          price: Number(value.price),
          mainCategory: value.mainCategory,
          type: value.type || undefined,
        })
        setIsOpen(false)
      } catch (err) {
        console.error('Failed to edit menu item:', err)
      }
    },
  })

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant={'outline'}>
          <PencilIcon color="currentColor" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="p-4">
        <SheetHeader>
          <SheetTitle>Edit Menu Item</SheetTitle>
        </SheetHeader>

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
        <form
          className="flex flex-col gap-5 py-6"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Margherita Pizza"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="price">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Price</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="0.00"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="mainCategory">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as MenuItemFormData['mainCategory'])
                  }
                >
                  <SelectTrigger onBlur={field.handleBlur}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appetizers">Appetizers</SelectItem>
                    <SelectItem value="main_courses">Main Courses</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="hard_drinks">Hard Drinks</SelectItem>
                    <SelectItem value="specials">Specials</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  Type{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value || undefined)
                  }
                  placeholder="e.g. momo — groups items of the same type together"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <SheetFooter className="mt-2">
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
                      <span>Editing...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </form.Subscribe>
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function DeleteMenuItemDrawer({ menuItem }: { menuItem: MenuItemProps }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const mutateDeleteItem = useMutation(api.restaurant.menuItems.deleteMenuItem)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await mutateDeleteItem({ id: menuItem._id })
      setIsOpen(false)
    } catch (err) {
      console.error('Failed to delete menu item:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline">
          <Trash2Icon />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="p-4">
        <SheetHeader>
          <SheetTitle>Delete Menu Item</SheetTitle>
          <SheetDescription>
            <div className="flex items-center gap-4 py-4 text-left">
              <div className="flex-shrink-0">
                {menuItem.photoURL ? (
                  <img
                    src={menuItem.photoURL}
                    alt={menuItem.name}
                    className="rounded-lg w-16 h-16 object-cover"
                  />
                ) : (
                  <div className="flex justify-center items-center bg-muted border border-border border-dashed rounded-lg w-16 h-16 text-muted-foreground">
                    <DonutImage className="stroke-[1.5] w-8 h-8" />
                  </div>
                )}
              </div>

              <div>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">
                  {menuItem.name}
                </span>
                ? This action cannot be undone.
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>

        <SheetFooter>
          <Button disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? (
              <>
                <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              'Delete'
            )}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
