import DonutImage from '@/assets/donutImage'
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoaderIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { motion, useMotionValue } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { Button } from '../ui/button'
import type { FoodItemProps } from './editMenu'

import { uploadMenuItemImage } from '@/firebase/firebase_storage'
import { deleteFoodItem, editFoodItem } from '@/firebase/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form, Formik } from 'formik'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { validationSchema } from './editMenu'
import { handleSwipeSnap } from '@/lib/swipeGestures'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'

type MenuCardProps = {
  food: FoodItemProps
  handleAddToCart: (food: FoodItemProps) => void
}

export function MenuCard({ food, handleAddToCart }: MenuCardProps) {
  const x = useMotionValue(0)
  const { userAdditional } = useFirebaseAuth()
  const isEmployee = userAdditional?.role === 'employee'
  const snapState = useRef<'center' | 'left' | 'right'>('center')

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isEmployee) {
      handleSwipeSnap(x, snapState, info)
    }
  }
  return (
    <>
      <div className="relative">
        {!isEmployee && (
          <div className="top-0 right-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer food={food} />
              <DeleteDrawer food={food} />
            </div>
          </div>
        )}
        <motion.div
          drag={!isEmployee ? 'x' : false}
          dragDirectionLock
          dragConstraints={{ left: -70, right: 70 }}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
          style={{ x }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="z-10 relative"
          onClick={() => handleAddToCart(food)}
        >
          <div className="relative flex items-center gap-2 bg-background active:bg-gray-200 dark:active:bg-muted m-0 p-0 border-1 transition-colors duration-200">
            {typeof food.foodPhoto === 'string' ? (
              <img
                alt={food.foodName}
                src={food.foodPhoto}
                className="flex-shrink-0 w-20 h-20 object-cover"
              />
            ) : (
              <div className="flex justify-center items-center w-20 h-20">
                <DonutImage />
              </div>
            )}

            <div className="flex flex-col">
              <strong className="font-medium text-base">{food.foodName}</strong>
              <p className="text-muted-foreground text-sm">{`Rs. ${food.foodPrice}`}</p>
            </div>
          </div>
        </motion.div>
        {!isEmployee && (
          <div className="top-0 left-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer food={food} />
              <DeleteDrawer food={food} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function EditDrawer({ food }: { food: FoodItemProps }) {
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const editFoodItemsMutation = useMutation({
    mutationFn: async (values: FoodItemProps) => {
      const photoFile: File | null = values.foodPhoto as File | null
      // Upload the photo and get the storage URL
      let storageURL = null
      if (photoFile !== null) {
        storageURL = await uploadMenuItemImage(values.foodId, photoFile)
      }

      // Replace the foodPhoto with the storage URL
      const valuesWithPhotoURL = {
        ...values,
        foodPhoto: storageURL,
      }

      // console.log("done adding", valuesWithPhotoURL);

      // Call the editFoodItem function
      await editFoodItem(valuesWithPhotoURL)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      setOpen(false) // Close the drawer

      toast('Food Item edited successfully!')
    },
    onError: (error: any) => {
      toast('error!', error)
    },
  })
  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Food Item</DrawerTitle>
          <DrawerDescription>
            Edit the food item here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={{
            foodId: food.foodId,
            foodName: food.foodName,
            foodCategory: food.foodCategory,
            foodPrice: food.foodPrice,
            foodPhoto: food.foodPhoto,
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            editFoodItemsMutation.mutate(values)
          }}
        >
          {(formik) => (
            <Form>
              <div className="gap-4 grid py-2">
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodName" className="text-right">
                    Food Name
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodName && formik.errors.foodName ? (
                      <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodName}
                      </div>
                    ) : null}
                    <Input
                      id="foodName"
                      name="foodName"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.foodName}
                    />
                  </div>
                </div>
              </div>
              <div className="gap-4 grid py-2">
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodCategory" className="text-right">
                    Category
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodCategory &&
                    formik.errors.foodCategory ? (
                      <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodCategory}
                      </div>
                    ) : null}
                    <Select
                      name="foodCategory"
                      onValueChange={(value) =>
                        formik.setFieldValue('foodCategory', value)
                      }
                      value={formik.values.foodCategory}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appetizers">Appetizers</SelectItem>
                        <SelectItem value="main_courses">
                          Main Course
                        </SelectItem>
                        <SelectItem value="desserts">Dessert</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>

                        <SelectItem value="hard_drinks">Hard Drinks</SelectItem>
                        <SelectItem value="specials">Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="gap-4 grid py-2">
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodPrice" className="text-right">
                    Food Price
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodPrice && formik.errors.foodPrice ? (
                      <div className="top-0 absolute bg-white p-1 border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodPrice}
                      </div>
                    ) : null}
                    <Input
                      id="foodPrice"
                      name="foodPrice"
                      type="number"
                      className="w-full"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.foodPrice}
                    />
                  </div>
                </div>
              </div>

              <div className="gap-4 grid py-2">
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="foodPhoto" className="text-right">
                    Food Photo
                  </Label>
                  <div className="relative col-span-3">
                    {formik.touched.foodPhoto && formik.errors.foodPhoto ? (
                      <div className="top-0 absolute bg-white border border-red-400 rounded text-red-500 text-xs -translate-y-full transform">
                        {formik.errors.foodPhoto}
                      </div>
                    ) : null}
                    <Input
                      id="foodPhoto"
                      name="foodPhoto"
                      type="file"
                      className="w-full"
                      onChange={(event) => {
                        formik.setFieldValue(
                          'foodPhoto',
                          event.currentTarget.files?.[0] || '',
                        )
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </div>

              <DrawerFooter>
                <Button className="text-white" type="submit">
                  {editFoodItemsMutation.isPending ? (
                    <LoaderIcon className="animate-spin" color="white" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline">
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

function DeleteDrawer({ food }: { food: FoodItemProps }) {
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const deleteFoodItemsMutation = useMutation({
    mutationFn: async () => {
      await deleteFoodItem(food.foodId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      setOpen(false) // Close the drawer

      toast('Food Item(s) removed successfully!')
    },
    onError: (error: any) => {
      toast('Error!', error)
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
          <DrawerTitle>Delete Food Item</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete {food.foodName}?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            className="text-white"
            type="submit"
            onClick={() => {
              deleteFoodItemsMutation.mutate() // Trigger the delete mutation
            }}
          >
            {deleteFoodItemsMutation.isPending ? (
              <LoaderIcon className="animate-spin" color="white" />
            ) : (
              'Save Changes'
            )}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
