import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Package, PlusIcon, LoaderIcon, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'motion/react'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAllEquipmentItems,
  addEquipmentItem,
  editEquipmentItem,
  deleteEquipmentItem,
} from '@/firebase/firestore'
import SplashScreen from '@/components/splashscreen'

export const Route = createLazyFileRoute('/home/equipment')({
  component: RouteComponent,
})

function RouteComponent() {
  return <EquipmentTracker />
}

export interface EquipmentItem {
  id: string
  name: string
  quantity: number
  lastUpdated: string
}

export default function EquipmentTracker() {
  const {
    data: equipment = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['equipment'],
    queryFn: getAllEquipmentItems,
  })

  if (isLoading) {
    return <SplashScreen />
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh] text-red-500">
        Error loading equipment items.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header with Total */}
      <div className="top-0 z-10 sticky bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto px-7 py-6 max-w-5xl">
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-bold text-primary text-2xl">Equipment</h1>
            <AddEquipmentDrawer />
          </div>
          {/* Total Items Card */}
          <motion.div
            className="hover:bg-primary/10 bg-gradient-to-r from-primary/10 to-primary/5 hover:shadow-lg hover:backdrop-blur-md p-3 border border-primary/20 hover:border-primary/40 rounded-lg transition-all duration-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Total Items
                </span>
              </div>
              <div className="font-bold text-primary text-lg">
                {equipment.length}
              </div>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              Last updated {new Date().toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="mx-auto px-7 py-6 pb-20 max-w-5xl">
        <div className="space-y-4">
          {equipment.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <Package className="opacity-50 mb-4 w-12 h-12" />
              <p>No items found.</p>
              <p className="text-sm">
                Add your first equipment item to get started.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {equipment
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item, i, arr) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="relative"
                  >
                    <div className="relative bg-card shadow-sm hover:shadow-md px-6 py-5 border border-border rounded-xl transition-all duration-200">
                      {/* Timeline dot */}
                      <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-card rounded-full w-3 h-3" />
                      {/* Timeline line */}
                      {i !== arr.length - 1 && (
                        <div className="top-10 -left-[10px] absolute bg-border w-[1px] h-[calc(100%-2.5rem)]" />
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-primary text-base">
                              {item.name}
                            </h3>
                          </div>
                          {/* Item details - only quantity and last updated */}
                          <div className="gap-2 grid grid-cols-2 mb-2 text-muted-foreground text-xs">
                            <span>
                              Qty:{' '}
                              <span className="font-medium">
                                {item.quantity}
                              </span>
                            </span>
                            <span className="col-span-1 text-right">
                              <span className="font-medium">
                                {new Date(
                                  item.lastUpdated,
                                ).toLocaleDateString()}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <EditEquipmentDrawer item={item} />
                          <DeleteEquipmentDrawer item={item} />
                        </div>
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

function AddEquipmentDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const addMutation = useMutation({
    mutationFn: addEquipmentItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData(['equipment'], (old: EquipmentItem[] = []) => [
        ...old,
        newItem,
      ])
      toast.success('Item added successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error adding item: ${error.message}`)
    },
  })
  const EquipmentSchema = Yup.object().shape({
    name: Yup.string().required('Item name is required'),
    quantity: Yup.number()
      .typeError('Quantity must be a number')
      .positive('Quantity must be greater than zero')
      .required('Quantity is required'),
  })
  return (
    <Drawer
      setBackgroundColorOnScale
      shouldScaleBackground
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <PlusIcon color="white" className="w-4 h-4" />
          Add Item
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-semibold text-xl">
            Add New Item
          </DrawerTitle>
        </DrawerHeader>
        <Formik
          initialValues={{
            name: '',
            quantity: '',
          }}
          validationSchema={EquipmentSchema}
          onSubmit={(values, { resetForm }) => {
            addMutation.mutate({
              name: values.name,
              quantity: Number(values.quantity),
              lastUpdated: new Date().toISOString(),
            })
            resetForm()
          }}
        >
          {() => (
            <Form className="gap-5 grid py-4">
              <div className="gap-2 grid">
                <Label
                  htmlFor="name"
                  className="font-medium text-gray-700 text-sm"
                >
                  Item Name
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter item name"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>
              <div className="gap-2 grid">
                <Label
                  htmlFor="quantity"
                  className="font-medium text-gray-700 text-sm"
                >
                  Quantity
                </Label>
                <Field
                  as={Input}
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="0"
                />
                <ErrorMessage
                  name="quantity"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>
              <DrawerFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderIcon color="white" className="animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Add Item'
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

function EditEquipmentDrawer({ item }: { item: EquipmentItem | null }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const editMutation = useMutation({
    mutationFn: editEquipmentItem,
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(['equipment'], (old: EquipmentItem[] = []) =>
        old.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
      )
      toast.success('Item updated successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error updating item: ${error.message}`)
    },
  })
  const EquipmentSchema = Yup.object().shape({
    name: Yup.string().required('Item name is required'),
    quantity: Yup.number()
      .typeError('Quantity must be a number')
      .positive('Quantity must be greater than zero')
      .required('Quantity is required'),
  })
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Drawer
        setBackgroundColorOnScale
        shouldScaleBackground
        open={open}
        onOpenChange={setOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-semibold text-xl">
              Edit Item
            </DrawerTitle>
          </DrawerHeader>
          <Formik
            initialValues={{
              name: item?.name || '',
              quantity: item?.quantity?.toString() || '',
            }}
            validationSchema={EquipmentSchema}
            onSubmit={(values, { resetForm }) => {
              if (!item) return
              editMutation.mutate({
                ...item,
                name: values.name,
                quantity: Number(values.quantity),
                lastUpdated: new Date().toISOString(),
              })
              resetForm()
            }}
            enableReinitialize
          >
            {() => (
              <Form className="gap-5 grid py-4">
                <div className="gap-2 grid">
                  <Label
                    htmlFor="edit-name"
                    className="font-medium text-gray-700 text-sm"
                  >
                    Item Name
                  </Label>
                  <Field
                    as={Input}
                    id="edit-name"
                    name="name"
                    placeholder="Enter item name"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="gap-2 grid">
                  <Label
                    htmlFor="edit-quantity"
                    className="font-medium text-gray-700 text-sm"
                  >
                    Quantity
                  </Label>
                  <Field
                    as={Input}
                    id="edit-quantity"
                    name="quantity"
                    type="number"
                    placeholder="0"
                  />
                  <ErrorMessage
                    name="quantity"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <DrawerFooter>
                  <Button type="submit" disabled={editMutation.isPending}>
                    {editMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <LoaderIcon color="white" className="animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
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
    </>
  )
}

function DeleteEquipmentDrawer({ item }: { item: EquipmentItem | null }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: () => deleteEquipmentItem(item?.id ?? ''),
    onSuccess: () => {
      queryClient.setQueryData(['equipment'], (old: EquipmentItem[] = []) =>
        old.filter((i) => i.id !== item?.id),
      )
      toast.success('Item deleted successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error deleting item: ${error.message}`)
    },
  })
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
      <Drawer
        setBackgroundColorOnScale
        shouldScaleBackground
        open={open}
        onOpenChange={setOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-semibold text-xl">
              Delete Item
            </DrawerTitle>
            <DrawerDescription>
              Are you sure you want to delete "{item?.name}"? This action cannot
              be undone.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderIcon color="white" className="animate-spin" />
                  Deleting...
                </span>
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
    </>
  )
}
