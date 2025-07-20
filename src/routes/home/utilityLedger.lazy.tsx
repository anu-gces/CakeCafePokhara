import { createLazyFileRoute } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'motion/react'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { CalendarDateRangePicker } from '@/components/ui/daterangepicker'

// Define DateRange type locally to match react-day-picker (from is required, but can be undefined)
type DateRange = { from: Date | undefined; to?: Date }

import { Button } from '@/components/ui/button'
import { LoaderIcon, ReceiptIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addUtilityLedgerItem,
  deleteUtilityLedgerItem,
  getAllUtilityLedgerItems,
  updateUtilityLedgerItemPaymentStatus,
  type UtilityLedgerItem,
} from '@/firebase/utilityLedger' // adjust path as needed
import SplashScreen from '@/components/splashscreen'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAllVendors } from '@/firebase/vendors'

export const Route = createLazyFileRoute('/home/utilityLedger')({
  component: RouteComponent,
})

function RouteComponent() {
  const { userAdditional } = useFirebaseAuth()
  const queryClient = useQueryClient()

  // Fetch utilityLedger collection
  const {
    data: items,
    isLoading,
    isError,
  } = useQuery<UtilityLedgerItem[]>({
    queryKey: ['utilityLedger'],
    queryFn: getAllUtilityLedgerItems,
  })

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: getAllVendors,
  })

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({
      itemId,
      paymentStatus,
    }: {
      itemId: string
      paymentStatus: 'paid' | 'credited'
    }) => {
      return await updateUtilityLedgerItemPaymentStatus(itemId, paymentStatus)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilityLedger'] })
      toast.success('Payment status updated successfully!')
    },
    onError: (error) => {
      toast.error(`Error updating payment status: ${error.message}`)
    },
  })

  // Filter state
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL')
  // CalendarDateRangePicker expects { from: Date | undefined, to?: Date }
  const today = new Date()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: today,
    to: today,
  })

  // Filter items by vendor and datepicker range
  let filteredItems = items || []
  if (selectedVendor !== 'ALL') {
    filteredItems = filteredItems.filter(
      (item) => item.vendorId === selectedVendor,
    )
  }
  if (dateRange.from && dateRange.to) {
    filteredItems = filteredItems.filter((item) => {
      const itemDate = new Date(item.addedAt)
      return itemDate >= dateRange.from! && itemDate <= dateRange.to!
    })
  } else if (dateRange.from) {
    filteredItems = filteredItems.filter((item) => {
      const itemDate = new Date(item.addedAt)
      return itemDate >= dateRange.from!
    })
  }

  // Calculate totals for accounting (filtered)
  const totalSpent =
    filteredItems.reduce((sum, item) => sum + Number(item.price), 0) || 0
  const totalCredited =
    filteredItems
      .filter((item) => item.paymentStatus === 'credited')
      .reduce((sum, item) => sum + Number(item.price), 0) || 0
  const totalPaid =
    filteredItems
      .filter((item) => item.paymentStatus === 'paid')
      .reduce((sum, item) => sum + Number(item.price), 0) || 0

  if (isLoading) {
    return <SplashScreen />
  }

  if (isError) {
    return (
      <div className="top-1/2 left-1/2 absolute text-red-500 -translate-x-1/2 -translate-y-1/2">
        Error loading utility ledger items.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header with Totals, Accounting, and Filters */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-7 py-6 max-w-xl">
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold text-primary text-2xl">
                Utility Ledger
              </h1>
              {/* Vendor Filter */}
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-36" id="vendorFilter">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Vendors</SelectItem>
                  {vendors?.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.nickname} ({vendor.firstName} {vendor.lastName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Date Range Picker */}
              <CalendarDateRangePicker
                value={dateRange}
                onChange={(range) =>
                  setDateRange({
                    from: range?.from ?? undefined,
                    to: range?.to ?? undefined,
                  })
                }
                className="w-64"
              />
            </div>
            {userAdditional?.role !== 'employee' && <LedgerDrawer />}
          </div>
          {/* Accounting Summary Card */}
          <motion.div
            className="hover:bg-white/30 dark:hover:bg-zinc-800/30 bg-gradient-to-r from-primary/10 dark:from-primary/20 to-primary/5 dark:to-primary/10 hover:shadow-lg hover:backdrop-blur-md p-3 border border-primary/20 hover:border-primary/40 dark:hover:border-zinc-600 rounded-lg transition-all duration-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ReceiptIcon />
                  <span className="font-medium text-primary text-sm">
                    Total Spent
                  </span>
                </div>
                <div className="font-bold text-primary text-lg">
                  Rs. {totalSpent.toFixed(2)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-orange-700 dark:text-orange-300 text-xs">
                  Credited (Unpaid)
                </span>
                <span className="font-semibold text-orange-700 dark:text-orange-300 text-sm">
                  Rs. {totalCredited.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-700 dark:text-green-300 text-xs">
                  Paid
                </span>
                <span className="font-semibold text-green-700 dark:text-green-300 text-sm">
                  Rs. {totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground text-xs">
                {filteredItems.length ?? 0} items • Last updated{' '}
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-xl">
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <ReceiptIcon />
              <p>No items found.</p>
              <p className="text-sm">
                Add your first utility item to get started.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredItems
                .slice() // copy to avoid mutating original
                .sort(
                  (a, b) =>
                    new Date(b.addedAt).getTime() -
                    new Date(a.addedAt).getTime(),
                )
                .map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="relative"
                  >
                    <div className="relative bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md px-6 py-5 border border-primary/10 dark:border-zinc-700 rounded-xl transition-all duration-200">
                      {/* Timeline dot */}
                      <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-white dark:border-zinc-900 rounded-full w-3 h-3" />
                      {/* Timeline line */}
                      {i !== filteredItems.length - 1 && (
                        <div className="top-10 -left-[10px] absolute dark:bg-zinc-700 bg-border w-[1px] h-[calc(100%-2.5rem)]" />
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex flex-col gap-2 mb-2">
                            <h3 className="font-semibold text-primary text-base">
                              {item.itemName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  item.paymentStatus === 'paid'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className={`text-xs ${
                                  item.paymentStatus === 'paid'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                }`}
                              >
                                {item.paymentStatus === 'paid'
                                  ? 'Paid'
                                  : 'Credited'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {new Date(item.addedAt).toLocaleDateString()}
                              </Badge>
                              {item.paymentStatus === 'credited' && (
                                <Button
                                  size="sm"
                                  className="px-3 py-1 h-7 text-xs"
                                  onClick={() =>
                                    updatePaymentStatusMutation.mutate({
                                      itemId: item.id,
                                      paymentStatus: 'paid',
                                    })
                                  }
                                  disabled={
                                    updatePaymentStatusMutation.isPending
                                  }
                                >
                                  {updatePaymentStatusMutation.isPending ? (
                                    <>
                                      <LoaderIcon
                                        color="white"
                                        className="mr-1 w-3 h-3 animate-spin"
                                      />
                                      Paying...
                                    </>
                                  ) : (
                                    'Mark Paid'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          {/* Vendor info */}
                          <div className="mb-2 text-muted-foreground text-xs">
                            Vendor:{' '}
                            <span className="font-medium">
                              {vendors?.find((v) => v.id === item.vendorId)
                                ?.nickname || 'Unknown'}
                            </span>
                          </div>
                          <div className="mb-2 text-muted-foreground text-xs">
                            Added by:{' '}
                            <span className="font-medium">{item.addedBy}</span>
                          </div>
                          {item.notes && (
                            <div className="bg-gray-50 dark:bg-zinc-800 mb-2 px-2 py-1 rounded text-muted-foreground text-xs italic">
                              {item.notes}
                            </div>
                          )}
                          {/* Item total */}
                          <div className="flex justify-between items-center pt-2 border-gray-100 dark:border-zinc-800 border-t">
                            <span className="text-muted-foreground text-xs">
                              Amount
                            </span>
                            <span className="font-semibold text-primary">
                              Rs. {Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {/* Delete button */}
                        {userAdditional?.role !== 'employee' && (
                          <div className="ml-3">
                            <DeleteItemDrawer id={item.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

const DeleteItemDrawer = ({ id }: { id: string }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteItemMutation = useMutation({
    mutationFn: deleteUtilityLedgerItem,
    onSuccess: (itemId) => {
      queryClient.setQueryData<UtilityLedgerItem[]>(
        ['utilityLedger'],
        (oldItems) => oldItems?.filter((item) => item.id !== itemId) || [],
      )
      toast.success('Item deleted successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error deleting item: ${error.message}`)
    },
  })

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
    >
      <DrawerTrigger className="hover:bg-red-100 dark:hover:bg-zinc-800/50 p-1 rounded-full transition-colors duration-200">
        <Trash2Icon className="w-5 h-5" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Item Ledger</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this Item from the Ledger?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            className="bg-primary"
            onClick={() => deleteItemMutation.mutate(id)}
          >
            {deleteItemMutation.isPending ? (
              <>
                <LoaderIcon
                  color="white"
                  className="mr-2 w-4 h-4 animate-spin"
                />
                Deleting...
              </>
            ) : (
              'Delete'
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

const LedgerSchema = Yup.object().shape({
  itemName: Yup.string().required('Item name is required'),
  vendorId: Yup.string().required('Vendor is required'),
  price: Yup.number()
    .typeError('Price must be a number')
    .positive('Price must be greater than zero')
    .required('Price is required'),
  paymentStatus: Yup.string()
    .oneOf(['paid', 'credited'])
    .required('Payment status is required'),
  purchaseDate: Yup.string(),
  notes: Yup.string(),
})

function LedgerDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { userAdditional, user } = useFirebaseAuth()

  const addItemMutation = useMutation({
    mutationFn: addUtilityLedgerItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData<UtilityLedgerItem[]>(
        ['utilityLedger'],
        (oldItems) => [...(oldItems || []), newItem],
      )
      toast.success('Item added successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error adding item: ${error.message}`)
    },
  })

  const { data: vendors, isLoading: isVendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: getAllVendors,
  })

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
    >
      <DrawerTrigger asChild>
        <Button variant="default">Add Item</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Utility Item</DrawerTitle>
          <DrawerDescription>
            Enter details for the new utility ledger entry.
          </DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={{
            itemName: '',
            vendorId: '',
            price: '',
            paymentStatus: 'paid',
            purchaseDate: new Date().toISOString(),
            notes: '',
          }}
          validationSchema={LedgerSchema}
          onSubmit={(values: any, { resetForm }: any) => {
            addItemMutation.mutate({
              itemName: values.itemName,
              vendorId: values.vendorId,
              price: Number(values.price),
              paymentStatus: values.paymentStatus as 'paid' | 'credited',
              purchaseDate: values.purchaseDate,
              notes: values.notes,
              addedBy:
                userAdditional?.firstName ||
                user?.displayName ||
                user?.email ||
                'Unknown',
              addedAt: new Date().toISOString(),
            })
            resetForm()
          }}
        >
          {({ setFieldValue }) => (
            <Form className="space-y-2">
              <ScrollArea className="h-72 overflow-y-auto">
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Field as={Input} id="itemName" name="itemName" required />
                  <ErrorMessage
                    name="itemName"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="vendorId">Vendor</Label>
                  <Field name="vendorId">
                    {({ field }: any) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          setFieldValue('vendorId', value)
                        }
                        required
                        disabled={isVendorsLoading}
                      >
                        <SelectTrigger id="vendorId">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors?.map((vendor: any) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.nickname} ({vendor.firstName}{' '}
                              {vendor.lastName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage
                    name="vendorId"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="price">Price</Label>
                  <Field
                    as={Input}
                    id="price"
                    name="price"
                    type="number"
                    required
                  />
                  <ErrorMessage
                    name="price"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Field
                    as={Input}
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    required
                  />
                  <ErrorMessage
                    name="purchaseDate"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Field name="paymentStatus">
                    {({ field, form }: any) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          form.setFieldValue('paymentStatus', value)
                        }
                        required
                      >
                        <SelectTrigger id="paymentStatus">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="credited">Credited</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage
                    name="paymentStatus"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Field as={Textarea} id="notes" name="notes" />
                  <ErrorMessage
                    name="notes"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
              </ScrollArea>
              <DrawerFooter>
                <Button type="submit" disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderIcon
                        className="w-4 h-4 animate-spin"
                        color="white"
                      />
                      Saving...
                    </span>
                  ) : (
                    <span>Save</span>
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
