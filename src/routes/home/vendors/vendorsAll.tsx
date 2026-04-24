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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { usePocketbaseAuth } from '@/lib/usePocketbaseAuth'

export const Route = createFileRoute('/home/vendors/vendorsAll')({
  component: RouteComponent,
})

type Vendors = {
  id: string
  name: string
  remarks?: string
}

async function getAllVendors(): Promise<Vendors[]> {
  return await pb.collection('vendors').getFullList({ sort: '-created' })
}

async function createPayLaterCustomer(
  data: Omit<Vendors, 'id'>,
): Promise<Vendors> {
  return await pb.collection('vendors').create(data)
}

async function updatePayLaterCustomer(customer: Vendors): Promise<Vendors> {
  return await pb.collection('vendors').update(customer.id, customer)
}

async function deletePayLaterCustomer(customer: Vendors): Promise<void> {
  await pb.collection('vendors').delete(customer.id)
}

function RouteComponent() {
  const [name, setName] = useState('')
  const [remarks, setRemarks] = useState('')

  const { user } = usePocketbaseAuth()
  const isEmployee = user.role === 'employee'

  const navigate = useNavigate({ from: '/home/vendors' })
  const queryClient = useQueryClient()

  const { data: vendors = [] } = useQuery<Vendors[]>({
    queryKey: ['vendors'],
    queryFn: getAllVendors,
  })

  const addVendorsMutation = useMutation({
    mutationFn: createPayLaterCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  const handleAddVendors = () => {
    if (!name) {
      toast.warning('Name is required.')
      return
    }

    addVendorsMutation.mutate(
      { name, remarks },
      {
        onSuccess: () => {
          setName('')
          setRemarks('')
          toast.success('Customer added successfully!', {
            description: name,
          })
        },
        onError: () => {
          toast.error('Failed to add customer.')
        },
      },
    )
  }

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
          <Drawer shouldScaleBackground={true} setBackgroundColorOnScale={true}>
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
              <div className="space-y-2">
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  placeholder="Remarks (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <DrawerFooter>
                <Button
                  className="flex items-center gap-2 w-full"
                  onClick={handleAddVendors}
                  disabled={addVendorsMutation.isPending}
                >
                  {addVendorsMutation.isPending && (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  )}
                  Save
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      <div>
        {vendors.map((payLaterCustomer) => (
          <VendorsCard
            key={payLaterCustomer.id}
            payLaterCustomer={payLaterCustomer}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  )
}

function VendorsCard({
  payLaterCustomer,
  navigate,
}: {
  payLaterCustomer: Vendors
  navigate: ReturnType<typeof useNavigate>
}) {
  const { user } = usePocketbaseAuth()
  const isEmployee = user.role === 'employee'
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
              <EditDrawer payLaterCustomer={payLaterCustomer} />
              <DeleteDrawer payLaterCustomer={payLaterCustomer} />
            </div>
          </div>
          <div className="top-0 right-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer payLaterCustomer={payLaterCustomer} />
              <DeleteDrawer payLaterCustomer={payLaterCustomer} />
            </div>
          </div>
        </>
      )}
      <motion.div
        key={payLaterCustomer.id}
        className="z-10 relative gap-0 grid grid-cols-1"
        drag={isEmployee ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: -70, right: 70 }}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
        style={{ x }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <Card
          onClick={() =>
            navigate({
              to: `/home/vendors/${payLaterCustomer.id}`,
              viewTransition: { types: ['slide-left'] },
            })
          }
          className="z-20 flex items-stretch bg-background hover:bg-muted shadow-none border-b last:border-b-0 rounded-none transition-colors"
        >
          <div className="flex flex-shrink-0 justify-center items-center rounded-none w-16 min-w-16 h-full">
            <User2 className="w-10 h-10 text-primary" />
          </div>
          <CardContent className="flex flex-col flex-1 justify-center px-0 py-3 min-w-0">
            <div className="text-muted-foreground text-sm truncate">
              {payLaterCustomer.name}
            </div>
            {payLaterCustomer.remarks && (
              <div className="text-muted-foreground text-xs truncate italic">
                {payLaterCustomer.remarks}
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

function EditDrawer({ payLaterCustomer }: { payLaterCustomer: Vendors }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(payLaterCustomer.name)
  const [remarks, setRemarks] = useState(payLaterCustomer.remarks ?? '')
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: updatePayLaterCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setOpen(false)
      toast.success('Customer updated!')
    },
    onError: () => {
      toast.error('Failed to update customer.')
    },
  })

  const handleSave = () => {
    if (!name) {
      toast.warning('Name is required.')
      return
    }
    updateMutation.mutate({ id: payLaterCustomer.id, name, remarks })
  }

  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Customer</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-2 px-6">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={updateMutation.isPending}
          />
          <Input
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={updateMutation.isPending}
          />
        </div>
        <DrawerFooter>
          <Button
            className="flex items-center gap-2 text-white"
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <LoaderIcon color="white" className="w-4 h-4 animate-spin" />
            )}
            Save Changes
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DeleteDrawer({ payLaterCustomer }: { payLaterCustomer: Vendors }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deletePayLaterCustomer,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setOpen(false)
      toast.success('Customer deleted!')
    },
    onError: () => {
      toast.error('Failed to delete customer.')
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
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Customer</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this customer?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            className="flex items-center gap-2 text-white"
            type="button"
            onClick={() => deleteMutation.mutate(payLaterCustomer)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <LoaderIcon color="white" className="w-4 h-4 animate-spin" />
            )}
            Delete
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
