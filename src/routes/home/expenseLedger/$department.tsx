import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  LoaderIcon,
  PlusIcon,
  ReceiptIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { endOfDay, format, startOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { pb } from '@/lib/pocketbase'
import { toast } from 'sonner'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
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
import { Select } from '@radix-ui/react-select'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/home/expenseLedger/$department')({
  component: RouteComponent,
  params: {
    parse: (params) => ({ department: params.department as Department }),
    stringify: (params: { department: Department }) => ({
      department: params.department,
    }),
  },
})

type Department = 'kitchen' | 'bakery' | 'utility' | 'barista'

export type ExpenseLedger = {
  id: string
  department: Department
  itemName: string
  quantity: number
  price: number
  remarks: string
  status: 'paid' | 'credited'
  createdBy: string
  date: string
  expand?: {
    createdBy?: {
      id: string
      firstName: string
      lastName: string
    }
    vendorId?: {
      id: string
      name: string
    }
  }
}

function RouteComponent() {
  const navigate = useNavigate()
  const { department } = Route.useParams()
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  const {
    data: entries = [],
    isLoading,
    error,
  } = useQuery<ExpenseLedger[]>({
    queryKey: ['expenseLedger', department, selectedDate],
    queryFn: async () => {
      const date = selectedDate ?? new Date()

      // 1. Get the local start and end of the chosen day (Nepal Time)
      const localStart = startOfDay(date)
      const localEnd = endOfDay(date)

      // 2. Convert to ISO and replace 'T' with ' ' for PocketBase string comparison
      const startStr = localStart.toISOString().replace('T', ' ')
      const endStr = localEnd.toISOString().replace('T', ' ')

      return await pb.collection('expenseLedger').getFullList({
        filter: `department="${department}" && date >= "${startStr}" && date <= "${endStr}"`,
        sort: '-date',
        expand: 'createdBy, vendorId',
      })
    },
    enabled: !!department,
  })

  const creditedTotal = entries
    .filter((e) => e.status === 'credited')
    .reduce((sum, e) => sum + e.price * e.quantity, 0)

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return await pb.collection('expenseLedger').delete(entryId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseLedger', department] })
      toast.success('Entry deleted.')
    },
    onError: handlePbError,
  })

  const markAsPaidMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return await pb
        .collection('expenseLedger')
        .update(entryId, { status: 'paid' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseLedger', department] })
      toast.success('Marked as paid!')
    },
    onError: handlePbError,
  })

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-4 pt-4 pb-4 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() =>
                navigate({
                  to: '/home',
                  viewTransition: { types: ['slide-right'] },
                })
              }
              variant="ghost"
              className="flex items-center gap-1.5 px-0 text-muted-foreground"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </Button>
            <Button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <PlusIcon color="white" className="w-4 h-4" />
              Add Entry
            </Button>
          </div>

          <h1 className="mb-3 font-bold text-primary text-2xl capitalize">
            {department} Ledger
          </h1>

          {/* Summary card */}
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Unpaid total
                </span>
              </div>
              <span className="font-bold text-primary text-lg">
                Rs. {creditedTotal.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 border-border border-t">
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Entries
                </div>
                <div className="font-semibold text-foreground text-lg">
                  {entries.length}
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Credited
                </div>
                <div className="font-semibold text-amber-600 dark:text-amber-400 text-lg">
                  {entries.filter((e) => e.status === 'credited').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-3 pb-20 max-w-xl">
        {/* Filter row */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">
              {entries.length} entries
            </span>
            {isLoading && (
              <LoaderIcon className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
          <DatePickerWithPresets
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {error && (
          <div className="py-4 text-red-500 text-sm text-center">
            Error loading entries: {(error as Error).message}
          </div>
        )}

        <div className="space-y-2">
          {!isLoading && entries.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-30 mb-3 w-10 h-10" />
              <p className="text-sm">No entries for this date.</p>
            </div>
          ) : (
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className="top-5 -left-3.5 absolute bg-primary border-2 border-white dark:border-zinc-900 rounded-full w-2.5 h-2.5" />
                  {i !== entries.length - 1 && (
                    <div className="top-8 -left-[9px] absolute dark:bg-zinc-700 bg-border w-px h-[calc(100%-1.5rem)]" />
                  )}

                  <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 px-4 pt-3 pb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">
                          {entry.itemName}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {format(new Date(entry.date), 'dd MMM yyyy, hh:mm a')}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          created by{' '}
                          <span className="font-medium text-foreground">
                            {entry.expand?.createdBy
                              ? `${entry.expand.createdBy.firstName} ${entry.expand.createdBy.lastName}`
                              : 'Unknown'}
                          </span>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            Vendor{' '}
                            <span className="font-medium text-foreground">
                              {entry.expand?.vendorId
                                ? `${entry.expand.vendorId.name}`
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            entry.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {entry.status === 'paid' ? 'Paid' : 'Credited'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex gap-4 px-4 py-2.5 border-border border-t">
                      <span className="text-muted-foreground text-xs">
                        Qty:{' '}
                        <span className="font-medium text-foreground">
                          {entry.quantity}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Price:{' '}
                        <span className="font-medium text-foreground">
                          Rs. {entry.price.toFixed(2)}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Total:{' '}
                        <span className="font-medium text-foreground">
                          Rs. {(entry.quantity * entry.price).toFixed(2)}
                        </span>
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-4 py-2.5 border-border border-t">
                      <span className="text-[10px] text-muted-foreground italic">
                        {entry.remarks ? `"${entry.remarks}"` : ''}
                      </span>
                      {entry.status === 'credited' && (
                        <Button
                          size="sm"
                          className="h-7 text-xs active:scale-95"
                          onClick={() => markAsPaidMutation.mutate(entry.id)}
                          disabled={markAsPaidMutation.isPending}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AddEntryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        department={department}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: ['expenseLedger', department],
          })
        }
      />
    </div>
  )
}

type ExpenseForm = {
  itemName: string
  quantity: string
  price: string
  remarks: string
  vendorId?: string
  status: 'paid' | 'credited'
  date: Date | undefined
}

const emptyForm: ExpenseForm = {
  itemName: '',
  quantity: '',
  price: '',
  remarks: '',
  vendorId: undefined,
  status: 'paid',
  date: new Date(),
}

function AddEntryDrawer({
  open,
  onOpenChange,
  department,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department
  onSuccess: () => void
}) {
  const { user } = usePocketbaseAuth()
  const [form, setForm] = useState<ExpenseForm>(emptyForm)

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => pb.collection('vendors').getFullList(),
    enabled: !!department,
  })

  const addEntryMutation = useMutation({
    mutationFn: async (form: ExpenseForm) => {
      return await pb.collection('expenseLedger').create({
        department,
        vendorId: form.vendorId,
        itemName: form.itemName,
        quantity: Number(form.quantity),
        price: Number(form.price),
        remarks: form.remarks,
        status: form.status,
        createdBy: user.id,
        date: form.date ? form.date : new Date(),
      })
    },
    onSuccess: () => {
      toast.success('Entry added!')
      setForm(emptyForm)
      onOpenChange(false)
      onSuccess()
    },
    onError: handlePbError,
  })

  return (
    <Drawer
      shouldScaleBackground
      setBackgroundColorOnScale
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="capitalize">
            Add {department} expense
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="itemName">Item name</Label>
            <Input
              id="itemName"
              placeholder="e.g. Flour, Meat, Milk"
              value={form.itemName}
              onChange={(e) =>
                setForm((f) => ({ ...f, itemName: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 5"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="price">Price (Rs.)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 500"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <DatePickerWithPresets
              selected={form.date}
              onSelect={(d) => setForm((f) => ({ ...f, date: d }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Vendor</Label>
            <Select
              value={form.vendorId}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, vendorId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors?.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              defaultValue="paid"
              value={form.status}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  status: value as 'paid' | 'credited',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="credited">Credited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              placeholder="Optional notes"
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={() => addEntryMutation.mutate(form)}
            disabled={
              !form.itemName ||
              !form.quantity ||
              !form.price ||
              addEntryMutation.isPending
            }
          >
            {addEntryMutation.isPending ? (
              <>
                <LoaderIcon
                  color="white"
                  className="mr-2 w-4 h-4 animate-spin"
                />
                Adding...
              </>
            ) : (
              'Add Entry'
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
