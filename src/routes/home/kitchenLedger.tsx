import { createFileRoute } from '@tanstack/react-router'
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
import { LoaderIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/firestore' // adjust path as needed
import SplashScreen from '@/components/splashscreen'

// const items = [
//   {
//     id: '1',
//     itemName: 'Tomato',
//     quantity: 10,
//     unit: 'kg',
//     price: 5.0,
//     notes: 'Fresh and organic',
//     addedBy: 'John Doe',
//     addedAt: '2023-11-01T10:00:00Z',
//   },
//   {
//     id: '2',
//     itemName: 'Potato',
//     quantity: 20,
//     unit: 'kg',
//     price: 2.0,
//     notes: 'Locally sourced',
//     addedBy: 'Jane Smith',
//     addedAt: '2023-11-02T11:30:00Z',
//   },
//   {
//     id: '3',
//     itemName: 'Rice',
//     quantity: 50,
//     unit: 'kg',
//     price: 1.5,
//     notes: 'Long grain, premium quality',
//     addedBy: 'Alice Johnson',
//     addedAt: '2023-11-03T09:15:00Z',
//   },
//   {
//     id: '4',
//     itemName: 'milk',
//     quantity: 5,
//     unit: 'liters',
//     price: 3.0,
//     notes: 'Organic milk from local farm',
//     addedBy: 'Bob Brown',
//     addedAt: '2023-11-04T14:45:00Z',
//   },
//   {
//     id: '5',
//     itemName: 'Eggs',
//     quantity: 30,
//     unit: 'dozen',
//     price: 2.5,
//     notes: 'Free-range eggs',
//     addedBy: 'Charlie Green',
//     addedAt: '2023-11-05T08:20:00Z',
//   },
//   {
//     id: '6',
//     itemName: 'Bread',
//     quantity: 15,
//     unit: 'loaves',
//     price: 1.0,
//     notes: 'Whole grain bread',
//     addedBy: 'Diana White',
//     addedAt: '2023-11-06T12:00:00Z',
//   },
// ]

type KitchenLedgerItem = {
  id: string
  itemName: string
  quantity: number
  unit: string
  price: number
  notes?: string
  addedBy: string
  addedAt: string // ISO date string
}

export const Route = createFileRoute('/home/kitchenLedger')({
  component: RouteComponent,
})

function RouteComponent() {
  const { userAdditional } = useFirebaseAuth()

  // Fetch kitchenLedger collection
  const {
    data: items,
    isLoading,
    isError,
  } = useQuery<KitchenLedgerItem[]>({
    queryKey: ['kitchenLedger'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'kitchenLedger'))
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<KitchenLedgerItem, 'id'>),
      })) as KitchenLedgerItem[]
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
    <div className="mx-auto px-7 py-6 pb-9 max-w-xl min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-primary text-2xl">Kitchen Ledger</h1>
        {userAdditional?.role !== 'employee' && <LedgerDrawer />}
      </div>
      <div className="space-y-6">
        {items?.length === 0 ? (
          <div className="text-muted-foreground text-center">
            No Items found.
          </div>
        ) : (
          <AnimatePresence>
            {items?.map((item, i) => (
              <motion.div key={item.id} layout className="relative">
                <div
                  key={item.addedAt + item.price}
                  className="relative bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg px-6 py-5 border border-primary/10 dark:border-zinc-700 rounded-xl transition"
                >
                  {/* Timeline dot */}
                  <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-white dark:border-zinc-900 rounded-full w-3 h-3" />
                  {/* Timeline line */}
                  {i !== items.length - 1 && (
                    <div className="top-10 -left-[10px] absolute dark:bg-zinc-700 bg-border w-[1px] h-[calc(100%-2.5rem)]" />
                  )}
                  {i === items.length - 1 && (
                    <>
                      <div className="top-10 -left-[10px] absolute flex items-end bg-transparent dark:bg-transparent dark:border-zinc-700 border-b border-l rounded-bl-2xl w-[calc(100%-12rem)] h-[calc(100%-1.5rem)]"></div>
                      <span className="right-0 -bottom-8 absolute px-2 py-1 rounded font-bold text-primary text-lg">
                        Total Paid: Rs.
                        {items.reduce(
                          (sum, p) =>
                            sum + Number(p.price) * Number(p.quantity),
                          0,
                        )}
                      </span>
                    </>
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-primary text-lg">
                      {item.itemName}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  {/* Card body */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-muted-foreground text-xs">
                    <span>
                      Qty:{' '}
                      <span className="font-semibold">
                        {item.quantity} {item.unit}
                      </span>
                    </span>
                    <span>
                      Price:{' '}
                      <span className="font-semibold">Rs.{item.price}</span>
                    </span>
                    <span>
                      Added By:{' '}
                      <span className="font-semibold">{item.addedBy}</span>
                    </span>
                  </div>
                  {item.notes && (
                    <div className="mb-1 text-muted-foreground text-xs italic">
                      {item.notes}
                    </div>
                  )}
                  <div className="right-6 bottom-4 absolute font-semibold text-primary text-base">
                    Total: Rs.{Number(item.price) * Number(item.quantity)}
                  </div>
                </div>
                <div
                  className="top-1/2 -right-6 absolute text-red-500 hover:text-red-700 active:scale-95 -translate-y-1/2"
                  title="Delete item"
                >
                  {userAdditional?.role !== 'employee' && (
                    <DeleteItemDrawer id={item.id} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

const DeleteItemDrawer = ({ id }: { id: string }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await deleteDoc(doc(db, 'kitchenLedger', itemId))
      return itemId
    },
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
      <DrawerTrigger>
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
  notes: Yup.string(),
})

function LedgerDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { userAdditional } = useFirebaseAuth()

  const addItemMutation = useMutation({
    mutationFn: async (newItem: Omit<KitchenLedgerItem, 'id'>) => {
      const docRef = await addDoc(collection(db, 'kitchenLedger'), newItem)
      return { id: docRef.id, ...newItem }
    },
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
              notes: values.notes,
              addedBy: userAdditional?.firstName || 'Unknown',
              addedAt: new Date().toISOString(),
            })

            resetForm()
          }}
        >
          {() => (
            <Form className="space-y-2 p-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Field as={Input} id="itemName" name="itemName" required />
                <ErrorMessage
                  name="itemName"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>
              <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Field as={Textarea} id="notes" name="notes" />
                <ErrorMessage
                  name="notes"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>
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
