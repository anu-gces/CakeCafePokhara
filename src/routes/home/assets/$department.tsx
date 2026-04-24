import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  LoaderIcon,
  PlusIcon,
  PackageIcon,
  Trash2Icon,
  ClipboardListIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { pb } from '@/lib/pocketbase'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePocketbaseAuth } from '@/lib/usePocketbaseAuth'
import { handlePbError } from '@/lib/utils'

type Department = 'permanentInventory' | 'equipment'

export const Route = createFileRoute('/home/assets/$department')({
  component: AssetsComponent,
  params: {
    parse: (params) => ({ department: params.department as Department }),
    stringify: (params: { department: Department }) => ({
      department: params.department,
    }),
  },
})

type Asset = {
  id: string
  name: string
  quantity: number
  department: Department
  remarks: string
  createdBy: string
  date: string
  expand?: {
    createdBy?: {
      firstName: string
      lastName: string
    }
  }
}

function AssetsComponent() {
  const navigate = useNavigate()
  const { department } = Route.useParams()
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: items = [], isLoading } = useQuery<Asset[]>({
    queryKey: ['assets', department],
    queryFn: async () => {
      return await pb.collection('assets').getFullList({
        filter: `department="${department}"`,
        sort: '-date',
        expand: 'createdBy',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection('assets').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', department] })
      toast.success('Asset removed')
    },
    onError: handlePbError,
  })

  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm p-4 border-primary/10 border-b">
        <div className="mx-auto max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() => navigate({ to: '/home' })}
              variant="ghost"
              className="flex items-center gap-1.5 px-0 text-muted-foreground"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </Button>
            <Button
              onClick={() => setDrawerOpen(true)}
              size="sm"
              className="gap-2"
            >
              <PlusIcon color="white" className="w-4 h-4" />
              Add {department} Item
            </Button>
          </div>

          <h1 className="mb-3 font-bold text-primary text-2xl capitalize">
            {department} Assets
          </h1>

          {/* Asset Summary Card */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 shadow-sm p-4 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <PackageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Unique Items
                </p>
                <p className="mt-1 font-bold text-xl leading-none">
                  {items.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                Stock Level
              </p>
              <p className="mt-1 font-bold text-primary text-xl leading-none">
                {totalUnits} units
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mx-auto px-4 py-6 pb-24 max-w-xl">
        {isLoading && (
          <LoaderIcon className="mx-auto w-6 h-6 text-muted-foreground animate-spin" />
        )}

        {!isLoading && items.length === 0 && (
          <div className="py-20 text-muted-foreground text-center">
            <ClipboardListIcon className="opacity-20 mx-auto mb-4 w-12 h-12" />
            <p>No equipment or inventory listed here.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex justify-between items-center bg-white dark:bg-zinc-900 shadow-sm p-4 border border-border rounded-xl"
            >
              <div className="pr-2 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <p className="text-[10px] text-muted-foreground">
                    Added {format(new Date(item.date), 'MMM dd')}
                  </p>
                  <span className="text-[10px] text-muted-foreground/50">
                    •
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {item.expand?.createdBy?.firstName ?? 'Staff'}
                  </p>
                </div>
                {item.remarks && (
                  <p className="mt-2 pl-2 border-primary/20 border-l-2 text-[11px] text-muted-foreground italic leading-relaxed">
                    {item.remarks}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 ml-auto shrink-0">
                <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg min-w-[50px] text-center">
                  <span className="block mb-0.5 font-bold text-[9px] text-muted-foreground uppercase leading-none tracking-tighter">
                    Qty
                  </span>
                  <span className="font-bold text-base leading-none">
                    {item.quantity}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AddAssetDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        department={department}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ['assets', department] })
        }
      />
    </div>
  )
}

function AddAssetDrawer({
  open,
  onOpenChange,
  department,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  department: Department
  onSuccess: () => void
}) {
  const { user } = usePocketbaseAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '', remarks: '' })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await pb.collection('assets').create({
        ...form,
        department,
        quantity: Number(form.quantity),
        createdBy: user.id,
        date: new Date().toISOString(),
      })
      toast.success('Added to inventory')
      setForm({ name: '', quantity: '', remarks: '' })
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      handlePbError(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="capitalize">
            Add {department} Asset
          </DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>Item Name</Label>
            <Input
              placeholder="e.g. Fridge, Blender, Soup Spoons"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total Quantity</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input
              placeholder="Serial No. or Condition"
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={!form.name || !form.quantity || loading}
          >
            {loading ? <LoaderIcon className="animate-spin" /> : 'Confirm Add'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
