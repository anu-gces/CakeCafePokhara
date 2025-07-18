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
  addKitchenLedgerItem,
  deleteKitchenLedgerItem,
  getAllKitchenLedgerItems,
  updateKitchenLedgerItemPaymentStatus,
} from '@/firebase/firestore' // adjust path as needed
import SplashScreen from '@/components/splashscreen'
import { ScrollArea } from '@/components/ui/scroll-area'

export type KitchenLedgerItem = {
  id: string
  itemName: string
  quantity: number
  paymentStatus: 'paid' | 'credited'
  unit: string
  price: number
  notes?: string
  addedBy: string
  addedAt: string // ISO date string
}

export const Route = createLazyFileRoute('/home/kitchenLedger')({
  component: RouteComponent,
})

function RouteComponent() {
  const { userAdditional } = useFirebaseAuth()
  const queryClient = useQueryClient()

  // Fetch kitchenLedger collection
  const {
    data: items,
    isLoading,
    isError,
  } = useQuery<KitchenLedgerItem[]>({
    queryKey: ['kitchenLedger'],
    queryFn: getAllKitchenLedgerItems,
  })

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({
      itemId,
      paymentStatus,
    }: {
      itemId: string
      paymentStatus: 'paid' | 'credited'
    }) => {
      return await updateKitchenLedgerItemPaymentStatus(itemId, paymentStatus)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenLedger'] })
      toast.success('Payment status updated successfully!')
    },
    onError: (error) => {
      toast.error(`Error updating payment status: ${error.message}`)
    },
  })

  if (isLoading) {
    return <SplashScreen />
  }

  if (isError) {
    return (
      <div className="top-1/2 left-1/2 absolute text-red-500 -translate-x-1/2 -translate-y-1/2">
        Error loading kitchen ledger items.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header with Total */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-7 py-6 max-w-xl">
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-bold text-primary text-2xl">Kitchen Ledger</h1>
            {userAdditional?.role !== 'employee' && <LedgerDrawer />}
          </div>
          {/* Total Amount Card */}
          <motion.div
            className="hover:bg-white/30 dark:hover:bg-zinc-800/30 bg-gradient-to-r from-primary/10 dark:from-primary/20 to-primary/5 dark:to-primary/10 hover:shadow-lg hover:backdrop-blur-md p-3 border border-primary/20 hover:border-primary/40 dark:hover:border-zinc-600 rounded-lg transition-all duration-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ReceiptIcon />
                <span className="font-medium text-primary text-sm">
                  Total Spent
                </span>
              </div>
              <div className="font-bold text-primary text-lg">
                Rs.{' '}
                {items
                  ?.reduce(
                    (sum, item) =>
                      sum + Number(item.price) * Number(item.quantity),
                    0,
                  )
                  .toFixed(2)}
              </div>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {items?.length ?? 0} items • Last updated{' '}
              {new Date().toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-xl">
        <div className="space-y-4">
          {items?.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <ReceiptIcon />
              <p>No items found.</p>
              <p className="text-sm">
                Add your first kitchen item to get started.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {items
                ?.slice() // copy to avoid mutating original
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
                      {i !== items.length - 1 && (
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
                          {/* Item details */}
                          <div className="gap-2 grid grid-cols-2 mb-2 text-muted-foreground text-xs">
                            <span>
                              Qty:{' '}
                              <span className="font-medium">
                                {item.quantity} {item.unit}
                              </span>
                            </span>
                            <span>
                              Rate:{' '}
                              <span className="font-medium">
                                Rs.{item.price}
                              </span>
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
                              Item Total
                            </span>
                            <span className="font-semibold text-primary">
                              Rs.
                              {(
                                Number(item.price) * Number(item.quantity)
                              ).toFixed(2)}
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
    mutationFn: deleteKitchenLedgerItem,
    onSuccess: (itemId) => {
      queryClient.setQueryData<KitchenLedgerItem[]>(
        ['kitchenLedger'],
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
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .positive('Quantity must be greater than zero')
    .required('Quantity is required'),
  unit: Yup.string().required('Unit is required'),
  price: Yup.number()
    .typeError('Price must be a number')
    .positive('Price must be greater than zero')
    .required('Price is required'),
  paymentStatus: Yup.string()
    .oneOf(['paid', 'credited'])
    .required('Payment status is required'),
  notes: Yup.string(),
})

function LedgerDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { userAdditional } = useFirebaseAuth()

  const addItemMutation = useMutation({
    mutationFn: addKitchenLedgerItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData<KitchenLedgerItem[]>(
        ['kitchenLedger'],
        (oldItems) => [...(oldItems || []), newItem],
      )
      toast.success('Item added successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error adding item: ${error.message}`)
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
        <Button variant="default">Add Item</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Kitchen Item</DrawerTitle>
          <DrawerDescription>
            Enter details for the new kitchen ledger entry.
          </DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={{
            itemName: '',
            quantity: '',
            unit: 'kg',
            price: '',
            paymentStatus: 'paid',
            notes: '',
          }}
          validationSchema={LedgerSchema}
          onSubmit={(values, { resetForm }) => {
            // Add logic to save item, e.g.:
            // addItem({ ...values, addedBy: loggedInUser, addedAt: Date.now() })
            addItemMutation.mutate({
              itemName: values.itemName,
              quantity: Number(values.quantity),
              unit: values.unit,
              price: Number(values.price),
              paymentStatus: values.paymentStatus as 'paid' | 'credited',
              notes: values.notes,
              addedBy: userAdditional?.firstName || 'Unknown',
              addedAt: new Date().toISOString(),
            })

            resetForm()
          }}
        >
          {() => (
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
                  <Label htmlFor="quantity">Quantity</Label>
                  <Field
                    as={Input}
                    id="quantity"
                    name="quantity"
                    type="number"
                    required
                  />
                  <ErrorMessage
                    name="quantity"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Field name="unit">
                    {({ field, form }: any) => (
                      <Select
                        defaultValue="kg"
                        value={field.value}
                        onValueChange={(value) =>
                          form.setFieldValue('unit', value)
                        }
                      >
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="litre">litre</SelectItem>
                          <SelectItem value="packet">packet</SelectItem>
                          <SelectItem value="piece">piece</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <ErrorMessage
                    name="unit"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2 px-4 py-2">
                  <Label htmlFor="price">Price(Per Item)</Label>
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
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Field name="paymentStatus">
                    {({ field, form }: any) => (
                      <Select
                        defaultValue="paid"
                        value={field.value}
                        onValueChange={(value) =>
                          form.setFieldValue('paymentStatus', value)
                        }
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
