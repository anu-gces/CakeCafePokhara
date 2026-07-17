import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronRight,
  LoaderIcon,
  PencilIcon,
  Plus,
  Trash2Icon,
  User2,
} from 'lucide-react'
import { type PanInfo, useMotionValue, motion } from 'motion/react'
import { handleSwipeSnap } from '@/lib/swipeGestures'
import { toast } from 'sonner'
import { api } from '../../../../convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import type { Doc } from '../../../../convex/_generated/dataModel'
import { InlineLoader } from '@/components/splashscreen'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

export const Route = createFileRoute('/home/vendors/vendorsAll')({
  component: RouteComponent,
})

type Vendor = Doc<'vendors'>

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  remarks: z.string(),
})

function RouteComponent() {
  const [isPending, setIsPending] = useState(false)

  const user = useQuery(api.users.currentUser)
  const isEmployee = user?.role === 'employee'

  const navigate = useNavigate({ from: '/home/vendors' })
  const vendors = useQuery(api.restaurant.vendors.listVendors)
  const addNewVendor = useMutation(api.restaurant.vendors.AddNewVendor)

  // 2. Initialize the TanStack Form instance
  const form = useForm({
    defaultValues: {
      name: '',
      remarks: '',
    },
    validators: {
      onChange: customerSchema,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true)
      try {
        await addNewVendor({
          name: value.name,
          remarks: value.remarks,
        })
        form.reset()
        toast.success(`Customer added successfully!`)
      } catch (error) {
        console.error(error)
        const errMsg =
          error instanceof Error ? error.message : 'Unknown error occurred.'
        toast.error('Failed to add customer.', {
          description: errMsg,
        })
      } finally {
        setIsPending(false)
      }
    },
  })

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-start mb-2 ml-6">
          <h1 className="font-semibold text-3xl tracking-tight">Vendors</h1>
          <div className="mt-2 rounded text-muted-foreground text-sm">
            Tip: Swipe card for edit/delete. Tap to view profile.
          </div>
        </div>
        {!isEmployee && (
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="flex gap-2 mr-6">
                <Plus size={18} color="white" />
                Add Customer
              </Button>
            </DrawerTrigger>
            <DrawerContent className="space-y-4 p-6">
              <DrawerHeader>
                <h2 className="font-medium text-xl">New Customer</h2>
              </DrawerHeader>

              {/* 3. Wrap everything inside form.handleSubmit */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  {/* Name Field */}
                  <form.Field
                    name="name"
                    children={(field) => (
                      <div className="space-y-1">
                        <Input
                          placeholder="Name"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isPending}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-destructive text-sm">
                            {field.state.meta.errors[0]?.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  {/* Remarks Field */}
                  <form.Field
                    name="remarks"
                    children={(field) => (
                      <div className="space-y-1">
                        <Input
                          placeholder="Remarks (optional)"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isPending}
                        />
                      </div>
                    )}
                  />
                </div>

                <DrawerFooter className="px-0">
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit]) => (
                      <Button
                        type="submit"
                        className="flex items-center gap-2 w-full"
                        disabled={!canSubmit || isPending}
                      >
                        {isPending && (
                          <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
                        )}
                        Save
                      </Button>
                    )}
                  />
                  <DrawerClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      <div>
        {vendors === undefined ? (
          <InlineLoader />
        ) : (
          <div>
            {vendors.map((vendor) => (
              <VendorsCard
                key={vendor._id}
                vendor={vendor}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VendorsCard({
  vendor,
  navigate,
}: {
  vendor: Vendor
  navigate: ReturnType<typeof useNavigate>
}) {
  const user = useQuery(api.users.currentUser)
  const isEmployee = user?.role === 'employee'
  const x = useMotionValue(0)
  const snapState = useRef<'center' | 'left' | 'right'>('center')

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isEmployee) {
      handleSwipeSnap(x, snapState, info)
    }
  }

  return (
    <div className="relative">
      {!isEmployee && (
        <>
          <div className="top-0 left-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer vendor={vendor} />
              <DeleteDrawer vendor={vendor} />
            </div>
          </div>
          <div className="top-0 right-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer vendor={vendor} />
              <DeleteDrawer vendor={vendor} />
            </div>
          </div>
        </>
      )}
      <motion.div
        key={vendor._id}
        className="z-10 relative gap-0 grid grid-cols-1"
        drag={isEmployee ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: -70, right: 70 }}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
        style={{ x }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onTap={() =>
          navigate({
            to: `/home/vendors/${vendor._id}`,
            viewTransition: { types: ['slide-left'] },
          })
        }
      >
        <Card className="z-20 flex items-stretch bg-background hover:bg-muted shadow-none border-b last:border-b-0 rounded-none transition-colors">
          <div className="flex flex-shrink-0 justify-center items-center rounded-none w-16 min-w-16 h-full">
            <User2 className="w-10 h-10 text-primary" />
          </div>
          <CardContent className="flex flex-col flex-1 justify-center px-0 py-3 min-w-0">
            <div className="text-muted-foreground text-sm truncate">
              {vendor.name}
            </div>
            {vendor.remarks && (
              <div className="text-muted-foreground text-xs truncate italic">
                {vendor.remarks}
              </div>
            )}
          </CardContent>
          <div className="flex items-center pr-4">
            <ChevronRight />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function EditDrawer({ vendor }: { vendor: Doc<'vendors'> }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const updateVendor = useMutation(api.restaurant.vendors.UpdateVendor)

  const form = useForm({
    defaultValues: {
      name: vendor.name,
      remarks: vendor.remarks ?? '',
    },
    validators: {
      onChange: customerSchema,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true)
      try {
        await updateVendor({
          id: vendor._id,
          name: value.name,
          remarks: value.remarks,
        })
        setOpen(false)
        toast.success('Edited Successfully!')
      } catch (error) {
        console.error(error)
        const errMsg =
          error instanceof Error ? error.message : 'Unknown error occurred.'
        toast.error('Failed to add customer.', {
          description: errMsg,
        })
      } finally {
        setIsPending(false)
      }
    },
  })

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Customer</DrawerTitle>
        </DrawerHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4 px-6"
        >
          <div className="space-y-3">
            {/* Name Field */}
            <form.Field
              name="name"
              children={(field) => (
                <div className="space-y-1">
                  <Input
                    placeholder="Name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isPending}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Remarks Field */}
            <form.Field
              name="remarks"
              children={(field) => (
                <div className="space-y-1">
                  <Input
                    placeholder="Remarks (optional)"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              )}
            />
          </div>

          <DrawerFooter className="px-0">
            <form.Subscribe
              selector={(state) => [state.canSubmit]}
              children={([canSubmit]) => (
                <Button
                  type="submit"
                  className="flex items-center gap-2 w-full text-white"
                  disabled={!canSubmit || isPending}
                >
                  {isPending && (
                    <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              )}
            />
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isPending}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function DeleteDrawer({ vendor }: { vendor: Doc<'vendors'> }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const deleteVendor = useMutation(api.restaurant.vendors.DeleteVendor)

  const handleDelete = async () => {
    setIsPending(true)
    try {
      await deleteVendor({ id: vendor._id })

      setOpen(false)
      toast.success(`Customer deleted successfully`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete customer')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Customer</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete {vendor.name}? This action cannot be
            undone.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter>
          <Button type="button" onClick={handleDelete} disabled={isPending}>
            {isPending && (
              <LoaderIcon color="white" className="w-4 h-4 animate-spin" />
            )}
            Delete
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
