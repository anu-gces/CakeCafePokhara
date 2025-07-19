import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { GiftIcon, PlusIcon, LoaderIcon, Pencil, Trash2 } from 'lucide-react'
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
  getAllAccessoriesItems,
  addAccessoriesItem,
  editAccessoriesItem,
  deleteAccessoriesItem,
} from '@/firebase/firestore'
import SplashScreen from '@/components/splashscreen'

export const Route = createLazyFileRoute('/home/accessories')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AccessoriesTracker />
}

export interface AccessoriesItem {
  id: string
  name: string
  quantity: number
  lastUpdated: string
}

export default function AccessoriesTracker() {
  const {
    data: accessories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['accessories'],
    queryFn: getAllAccessoriesItems,
  })

  if (isLoading) return <SplashScreen />
  if (isError)
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh] text-red-500">
        Error loading accessories items.
      </div>
    )

  return (
    <div className="h-full overflow-y-auto">
      <div className="top-0 z-10 sticky bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto px-7 py-6 max-w-5xl">
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-bold text-primary text-2xl">Accessories</h1>
            <AddAccessoriesDrawer />
          </div>
          {/* Total Accessories Card */}
          <motion.div
            className="hover:bg-primary/10 bg-gradient-to-r from-primary/10 to-primary/5 hover:shadow-lg hover:backdrop-blur-md p-3 border border-primary/20 hover:border-primary/40 rounded-lg transition-all duration-300"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GiftIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Total Accessories
                </span>
              </div>
              <div className="font-bold text-primary text-lg">
                {accessories.length}
              </div>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              Last updated {new Date().toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      </div>
      <div className="mx-auto px-7 py-6 pb-20 max-w-5xl">
        <div className="space-y-4">
          {accessories.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground text-center">
              <GiftIcon className="opacity-50 mb-4 w-12 h-12" />
              <p>No accessories found.</p>
              <p className="text-sm">
                Add your first accessory to get started.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {accessories
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
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
                    <div className="relative bg-card shadow-sm hover:shadow-md px-6 py-5 border border-border rounded-xl transition-all duration-200">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-primary text-base">
                              {item.name}
                            </h3>
                          </div>
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
                          <EditAccessoriesDrawer item={item} />
                          <DeleteAccessoriesDrawer item={item} />
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

function AddAccessoriesDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const addMutation = useMutation({
    mutationFn: addAccessoriesItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData(
        ['accessories'],
        (old: AccessoriesItem[] = []) => [...old, newItem],
      )
      toast.success('Accessory added successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error adding accessory: ${error.message}`)
    },
  })
  const AccessoriesSchema = Yup.object().shape({
    name: Yup.string().required('Accessory name is required'),
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
          Add Accessory
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-semibold text-xl">
            Add New Accessory
          </DrawerTitle>
        </DrawerHeader>
        <Formik
          initialValues={{
            name: '',
            quantity: '',
          }}
          validationSchema={AccessoriesSchema}
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
                  Accessory Name
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter accessory name"
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
                    'Add Accessory'
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

function EditAccessoriesDrawer({ item }: { item: AccessoriesItem | null }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const editMutation = useMutation({
    mutationFn: editAccessoriesItem,
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(['accessories'], (old: AccessoriesItem[] = []) =>
        old.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
      )
      toast.success('Accessory updated successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error updating accessory: ${error.message}`)
    },
  })
  const AccessoriesSchema = Yup.object().shape({
    name: Yup.string().required('Accessory name is required'),
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
              Edit Accessory
            </DrawerTitle>
          </DrawerHeader>
          <Formik
            initialValues={{
              name: item?.name || '',
              quantity: item?.quantity?.toString() || '',
            }}
            validationSchema={AccessoriesSchema}
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
                    Accessory Name
                  </Label>
                  <Field
                    as={Input}
                    id="edit-name"
                    name="name"
                    placeholder="Enter accessory name"
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

function DeleteAccessoriesDrawer({ item }: { item: AccessoriesItem | null }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: () => deleteAccessoriesItem(item?.id ?? ''),
    onSuccess: () => {
      queryClient.setQueryData(['accessories'], (old: AccessoriesItem[] = []) =>
        old.filter((i) => i.id !== item?.id),
      )
      toast.success('Accessory deleted successfully!')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error deleting accessory: ${error.message}`)
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
              Delete Accessory
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
