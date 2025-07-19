import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDownIcon, EyeIcon, LoaderIcon } from 'lucide-react'
import {
  deleteOrder,
  editOrder,
  type ProcessedOrder,
} from '@/firebase/firestore'
import { Input } from '../ui/input'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, SquarePenIcon, Trash2Icon } from 'lucide-react'
import * as Yup from 'yup'
import CakeCafeLogo from '@/assets/Logob.png'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Form, Formik } from 'formik'
import React, { type Dispatch, type SetStateAction } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { getWeeklyDocId } from '@/firebase/firestore.utils'

export const columns: ColumnDef<ProcessedOrder>[] = [
  {
    id: 'actions',
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const order = row.original
      const [isEditDrawerOpen, setEditDrawerOpen] = React.useState(false)
      const [isDeleteDrawerOpen, setDeleteDrawerOpen] = React.useState(false)
      const [isReceiptDrawerOpen, setReceiptDrawerOpen] = React.useState(false)

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 w-8 h-8"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setReceiptDrawerOpen(true)
                }}
              >
                <EyeIcon /> View Receipt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setEditDrawerOpen(true)
                }}
              >
                <SquarePenIcon /> Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-primary focus:text-rose-400"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteDrawerOpen(true)
                }}
              >
                <Trash2Icon /> Delete Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isReceiptDrawerOpen && (
            <ReceiptDrawer
              data={order}
              receiptOpen={isReceiptDrawerOpen}
              setReceiptOpen={setReceiptDrawerOpen}
            />
          )}
          {isEditDrawerOpen && (
            <EditDrawer
              isEditDrawerOpen={isEditDrawerOpen}
              setEditDrawerOpen={setEditDrawerOpen}
              order={order}
            />
          )}
          {isDeleteDrawerOpen && (
            <DeleteDrawer
              isDeleteDrawerOpen={isDeleteDrawerOpen}
              setDeleteDrawerOpen={setDeleteDrawerOpen}
              order={order}
            />
          )}
        </>
      )
    },
  },
  {
    accessorKey: 'receiptId',
    id: 'receiptId',
    header: 'Receipt ID',
  },
  {
    accessorKey: 'kotNumber',
    id: 'kotNumber',
    header: 'KOT Number',
  },
  {
    accessorKey: 'status',
    id: 'status',
    header: 'Status',
  },
  // Subtotal and total are not editable, so remove from columns
  {
    accessorKey: 'discountRate',
    id: 'discountRate',
    header: 'Discount Rate',
    cell: ({ getValue }) => `${getValue<number>()}%`, // Format the value as a percentage
  },
  {
    accessorKey: 'taxRate',
    id: 'taxRate',
    header: 'Tax Rate',
    cell: ({ getValue }) => `${getValue<number>()}%`, // Format the value as a percentage
  },
  {
    accessorKey: 'manualRounding',
    id: 'manualRounding',
    header: 'Manual Rounding',
    cell: ({ getValue }) => `Rs. ${getValue<number>().toFixed(2)}`, // Format the value with "Rs." and two decimal places
  },

  {
    accessorKey: 'deliveryFee',
    id: 'deliveryFee',
    header: 'Delivery Fee',
    cell: ({ getValue }) => `Rs. ${(getValue<number>() || 0).toFixed(2)}`, // Format the value with "Rs." and two decimal places
  },

  {
    accessorKey: 'totalAmount',
    id: 'totalAmount',
    header: 'Total Amount',
    cell: ({ getValue }) => `Rs. ${getValue<number>().toFixed(2)}`, // Format the value with "Rs." and two decimal places
  },

  {
    accessorKey: 'receiptDate',
    id: 'receiptDate',
    header: ({ column }) => (
      <div
        className="flex gap-2 cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Receipt Date
        <ArrowUpDownIcon className="w-4 h-4" />
      </div>
    ),
    cell: ({ getValue }) => {
      const raw = getValue<unknown>()
      const date =
        typeof raw === 'string' || raw instanceof Date ? new Date(raw) : null

      return date && !isNaN(date.getTime())
        ? format(date, 'dd MMM yy, HH:mm')
        : 'N/A'
    },
    sortingFn: 'datetime',
    enableSorting: true,
    filterFn: (row, columnId, filterValue) => {
      const raw = row.getValue(columnId)
      const date =
        typeof raw === 'string' || raw instanceof Date ? new Date(raw) : null

      if (!date || isNaN(date.getTime())) return false

      const formatted = format(date, 'dd MMM yy, HH:mm')
      const rawString = typeof raw === 'string' ? raw.toLowerCase() : ''
      return (
        rawString.includes(filterValue.toLowerCase()) ||
        formatted.toLowerCase().includes(filterValue.toLowerCase())
      )
    },
  },

  {
    accessorKey: 'creditor',
    id: 'creditor',
    header: 'Creditor',
  },
  {
    accessorKey: 'paymentMethod',
    id: 'paymentMethod',
    header: ({ column }) => {
      const currentFilter = column.getFilterValue() as string

      // Default to 'cash' if no filter is set
      const displayFilter = currentFilter || 'cash'

      // Set initial filter to cash if none is set
      if (!currentFilter) {
        column.setFilterValue('cash')
      }

      return (
        <div
          className="cursor-pointer select-none"
          onClick={() => {
            // Cycle through filters: cash -> bank -> esewa -> cash
            if (currentFilter === 'cash') {
              column.setFilterValue('bank')
            } else if (currentFilter === 'bank') {
              column.setFilterValue('esewa')
            } else {
              column.setFilterValue('cash')
            }
          }}
        >
          <span className="bg-primary px-2 py-1 rounded font-medium text-primary-foreground text-xs">
            {displayFilter.charAt(0).toUpperCase() + displayFilter.slice(1)}
          </span>
        </div>
      )
    },
    cell: ({ getValue }) => {
      const value = getValue<string>()
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'
    },
  },
  {
    accessorKey: 'remarks',
    id: 'remarks',
    header: ({ column }) => {
      return (
        <Input
          type="text"
          className="input-bordered input input-sm"
          placeholder="Remarks"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
        />
      )
    },
  },

  {
    accessorKey: 'complementary',
    id: 'complementary',
    header: 'Complementary',
  },
  {
    accessorKey: 'tableNumber',
    id: 'tableNumber',
    header: 'Table Number',
  },

  {
    accessorKey: 'processedBy',
    id: 'processedBy',
    header: 'Processed By',
  },
]

interface EditDrawerProps {
  isEditDrawerOpen: boolean
  setEditDrawerOpen: Dispatch<SetStateAction<boolean>>
  order: ProcessedOrder
}

const EditDrawer = ({
  isEditDrawerOpen,
  setEditDrawerOpen,
  order,
}: EditDrawerProps) => {
  const initialValues = {
    kotNumber: order.kotNumber || '',
    status: order.status || '',
    discountRate: order.discountRate || 0,
    taxRate: order.taxRate || 0,
    receiptDate: order.receiptDate
      ? typeof order.receiptDate === 'string'
        ? order.receiptDate
        : format(order.receiptDate, 'yyyy-MM-dd HH:mm')
      : '',
    creditor: order.creditor || '',
    remarks: order.remarks || '',
    complementary: order.complementary || false,
    tableNumber: order.tableNumber || 0,
    manualRounding: order.manualRounding || 0,
    paymentMethod: order.paymentMethod || 'cash',
  }

  // Yup validation schema
  const EditOrderSchema = Yup.object().shape({
    kotNumber: Yup.string().required('KOT Number is required'),
    discountRate: Yup.number()
      .min(0)
      .max(100)
      .required('Discount Rate is required'),
    taxRate: Yup.number().min(0).max(100).required('Tax Rate is required'),
    receiptDate: Yup.string().required('Receipt Date is required'),
    creditor: Yup.string().nullable(),
    remarks: Yup.string(),
    complementary: Yup.boolean(),
    tableNumber: Yup.number().required('Table Number is required'),
    manualRounding: Yup.number(),
    paymentMethod: Yup.string()
      .oneOf(['cash', 'bank', 'esewa'])
      .required('Payment Method is required'),
  })

  const queryClient = useQueryClient()

  // Local state for manual rounding input as string (like takeOrder.tsx)
  const [roundingInput, setRoundingInput] = React.useState(
    (order.manualRounding || 0).toString(),
  )

  // Keep rounding input in sync with initial values
  React.useEffect(() => {
    setRoundingInput((order.manualRounding || 0).toString())
  }, [order.manualRounding])

  const editOrderMutation = useMutation({
    mutationFn: async ({
      batchDocId,
      updatedOrder,
    }: {
      batchDocId: string
      updatedOrder: ProcessedOrder
    }) => {
      await editOrder(batchDocId, updatedOrder)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getAllOrders'] })
      queryClient.refetchQueries({ queryKey: ['getAllOrders'] })
      toast.success('Order updated successfully')
      setEditDrawerOpen(false)
    },
  })

  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={isEditDrawerOpen}
      onOpenChange={setEditDrawerOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Order</DrawerTitle>
          <DrawerDescription>
            Make changes to this order here.
          </DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={EditOrderSchema}
          onSubmit={async (values, actions) => {
            try {
              const updatedOrder: ProcessedOrder = {
                ...order,
                ...values,
                receiptDate: new Date(values.receiptDate).toISOString(),
                paymentMethod: values.paymentMethod as
                  | 'cash'
                  | 'bank'
                  | 'esewa',
              }

              editOrderMutation.mutate({
                batchDocId: getWeeklyDocId(new Date(order.receiptDate)),
                updatedOrder,
              })
            } catch (err) {
              console.error(err)
              toast.error('Failed to update order')
            } finally {
              actions.setSubmitting(false)
            }
          }}
        >
          {(formik) => (
            <Form className="space-y-4">
              <ScrollArea className="px-4 h-72 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  {/* Non-editable fields */}
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="receiptId"
                    >
                      Receipt ID
                    </Label>
                    <Input
                      id="receiptId"
                      value={order.receiptId}
                      disabled
                      className="mb-2"
                    />
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="kotNumber"
                    >
                      KOT Number
                    </Label>
                    <Input
                      id="kotNumber"
                      name="kotNumber"
                      value={formik.values.kotNumber}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.kotNumber && formik.errors.kotNumber && (
                      <div className="text-red-500 text-xs">
                        {formik.errors.kotNumber}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="processedBy"
                    >
                      Processed By
                    </Label>
                    <Input
                      id="processedBy"
                      value={order.processedBy}
                      disabled
                      className="mb-2"
                    />
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="status"
                    >
                      Status
                    </Label>
                    <Input
                      id="status"
                      name="status"
                      value={formik.values.status}
                      disabled
                      className="mb-2"
                    />
                  </div>
                  {/* Editable fields (only those in AddToCart/ProcessedOrder) */}
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="discountRate"
                    >
                      Discount Rate (%)
                    </Label>
                    <Input
                      id="discountRate"
                      name="discountRate"
                      type="number"
                      value={formik.values.discountRate}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.discountRate &&
                      formik.errors.discountRate && (
                        <div className="text-red-500 text-xs">
                          {formik.errors.discountRate}
                        </div>
                      )}
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="taxRate"
                    >
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      value={formik.values.taxRate}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.taxRate && formik.errors.taxRate && (
                      <div className="text-red-500 text-xs">
                        {formik.errors.taxRate}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="manualRounding"
                    >
                      Manual Rounding
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-transparent w-8 h-8"
                        onClick={() => {
                          const newValue = Number(roundingInput) - 1
                          setRoundingInput(newValue.toString())
                          formik.setFieldValue('manualRounding', newValue)
                        }}
                      >
                        <span className="text-lg">-</span>
                      </Button>
                      <Input
                        id="manualRounding"
                        name="manualRounding"
                        type="text"
                        value={roundingInput}
                        onChange={(e) => {
                          const val = e.target.value
                          setRoundingInput(val)
                          if (/^-?\d*$/.test(val) && val !== '-') {
                            const num = Number(val)
                            if (!isNaN(num)) {
                              formik.setFieldValue('manualRounding', num)
                            }
                          }
                        }}
                        onBlur={() => {
                          // On blur, if input is not a valid number, reset to formik value
                          if (
                            roundingInput === '-' ||
                            isNaN(Number(roundingInput))
                          ) {
                            setRoundingInput(
                              formik.values.manualRounding.toString(),
                            )
                          } else {
                            formik.setFieldValue(
                              'manualRounding',
                              Number(roundingInput),
                            )
                          }
                        }}
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-transparent w-8 h-8"
                        onClick={() => {
                          const newValue = Number(roundingInput) + 1
                          setRoundingInput(newValue.toString())
                          formik.setFieldValue('manualRounding', newValue)
                        }}
                      >
                        <span className="text-lg">+</span>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="receiptDate"
                    >
                      Receipt Date
                    </Label>
                    <Input
                      id="receiptDate"
                      name="receiptDate"
                      type="datetime-local"
                      value={
                        formik.values.receiptDate &&
                        !isNaN(new Date(formik.values.receiptDate).getTime())
                          ? format(
                              new Date(formik.values.receiptDate),
                              "yyyy-MM-dd'T'HH:mm",
                            )
                          : ''
                      }
                      onChange={formik.handleChange}
                    />

                    {formik.touched.receiptDate &&
                      formik.errors.receiptDate && (
                        <div className="text-red-500 text-xs">
                          {formik.errors.receiptDate}
                        </div>
                      )}
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="creditor"
                    >
                      Creditor
                    </Label>
                    <Input
                      id="creditor"
                      name="creditor"
                      value={formik.values.creditor ?? ''}
                      onChange={formik.handleChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="remarks"
                    >
                      Remarks
                    </Label>
                    <Input
                      id="remarks"
                      name="remarks"
                      value={formik.values.remarks}
                      onChange={formik.handleChange}
                    />
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="paymentMethod"
                    >
                      Payment Method
                    </Label>
                    <Select
                      value={formik.values.paymentMethod}
                      onValueChange={(value) =>
                        formik.setFieldValue('paymentMethod', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="esewa">eSewa</SelectItem>
                      </SelectContent>
                    </Select>
                    {formik.touched.paymentMethod &&
                      formik.errors.paymentMethod && (
                        <div className="text-red-500 text-xs">
                          {formik.errors.paymentMethod}
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="complementary"
                      name="complementary"
                      checked={formik.values.complementary}
                      onCheckedChange={(checked) => {
                        formik.setFieldValue('complementary', checked)
                      }}
                    />
                    <Label
                      htmlFor="complementary"
                      className="font-semibold text-xs"
                    >
                      Complementary
                    </Label>
                  </div>
                  <div>
                    <Label
                      className="mb-1 font-semibold text-xs"
                      htmlFor="tableNumber"
                    >
                      Table Number
                    </Label>
                    <Input
                      id="tableNumber"
                      name="tableNumber"
                      type="number"
                      value={formik.values.tableNumber}
                      onChange={formik.handleChange}
                    />
                  </div>
                </div>
              </ScrollArea>

              <DrawerFooter>
                <Button type="submit" disabled={formik.isSubmitting}>
                  {editOrderMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderIcon
                        className="w-4 h-4 animate-spin"
                        color="white"
                      />
                      Saving...
                    </span>
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditDrawerOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </DrawerFooter>
            </Form>
          )}
        </Formik>
      </DrawerContent>
    </Drawer>
  )
}

interface DeleteDrawerProps {
  isDeleteDrawerOpen: boolean
  setDeleteDrawerOpen: Dispatch<SetStateAction<boolean>>
  order?: ProcessedOrder
}

const DeleteDrawer = ({
  isDeleteDrawerOpen,
  setDeleteDrawerOpen,
  order,
}: DeleteDrawerProps) => {
  const queryClient = useQueryClient()
  const [localLoading, setLocalLoading] = React.useState(false)
  const deleteOrderMutation = useMutation({
    mutationFn: async ({
      batchDocId,
      receiptId,
    }: {
      batchDocId: string
      receiptId: string
    }) => {
      await deleteOrder(batchDocId, receiptId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getAllOrders'] })
      toast.success('Order deleted successfully')
      setDeleteDrawerOpen(false)
      setLocalLoading(false)
    },
    onError: () => {
      toast.error('Failed to delete order')
      setLocalLoading(false)
    },
  })

  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={isDeleteDrawerOpen}
      onOpenChange={setDeleteDrawerOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Order</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this order?
            <br />
            <span className="font-semibold text-red-500">Receipt ID:</span>
            <span className="ml-2 font-mono">{order?.receiptId ?? 'N/A'}</span>
            <br />
            <span className="text-muted-foreground text-xs">
              This action cannot be undone.
            </span>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            type="button"
            disabled={deleteOrderMutation.isPending || localLoading}
            onClick={async (e) => {
              e.stopPropagation()
              if (!order) return
              setLocalLoading(true)
              await deleteOrderMutation.mutateAsync({
                batchDocId: getWeeklyDocId(new Date(order.receiptDate)),
                receiptId: order.receiptId,
              })
            }}
          >
            {deleteOrderMutation.isPending || localLoading ? (
              <span className="flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" color="white" />
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </Button>
          <Button
            variant="outline"
            disabled={deleteOrderMutation.isPending || localLoading}
            onClick={(e) => {
              e.stopPropagation()
              setDeleteDrawerOpen(false)
            }}
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function ReceiptDrawer({
  data,
  receiptOpen,
  setReceiptOpen,
}: {
  data: ProcessedOrder
  receiptOpen: boolean
  setReceiptOpen: (open: boolean) => void
}) {
  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={receiptOpen}
      onOpenChange={setReceiptOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <div className="flex md:flex-row flex-col md:justify-center lg:justify-center items-center gap-4 p-2">
            <div className="flex items-center gap-4">
              <img
                src={CakeCafeLogo}
                width="48"
                height="48"
                alt="Company Logo"
                className="rounded-md"
              />
              <div className="gap-2 grid">
                <DrawerTitle className="font-bold text-xl">
                  Cake Cafe<sup className="text-[12px]">TM</sup>
                </DrawerTitle>
                <DrawerDescription className="text-gray-500 dark:text-gray-400 text-sm">
                  Jwalakhel-8, Pokhara
                  <br />
                  Phone: +061-531234
                  <br />
                  Email: info@CakeCafe.com.np
                </DrawerDescription>
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="mx-auto w-full print:max-w-[300px] max-w-sm font-mono print:text-xs text-sm">
          <div className="bg-white dark:bg-black p-4 border border-border">
            <h2 className="mb-4 font-bold text-center">Receipt</h2>
            <div className="mb-4 text-xs text-center">
              <div>ID: {data.receiptId}</div>
              <div>
                Date:{' '}
                {format(new Date(data.receiptDate), "yyyy-MM-dd '@' hh:mm a")}
              </div>
            </div>

            <ScrollArea className="h-72 overflow-y-auto">
              <Table className="table-fixed">
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead className="text-left">Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.foodId}>
                      <TableCell>
                        {item.foodName}
                        {item.selectedSubcategory &&
                          item.selectedSubcategory.name && (
                            <span className="ml-1 text-muted-foreground text-xs">
                              &mdash; {item.selectedSubcategory.name}
                            </span>
                          )}
                      </TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-right">
                        Rs.
                        {(
                          item.qty *
                          (item.selectedSubcategory &&
                          typeof item.selectedSubcategory.price === 'number'
                            ? item.selectedSubcategory.price
                            : item.foodPrice)
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold text-right">
                      Sub Total
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      Rs.
                      {data.items
                        .reduce(
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.foodPrice),
                          0,
                        )
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Discount ({data.discountRate}%)
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      - Rs.
                      {(
                        data.items.reduce(
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.foodPrice),
                          0,
                        ) *
                        (data.discountRate / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Tax ({data.taxRate}%)
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      + Rs.
                      {(
                        (data.items.reduce(
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.foodPrice),
                          0,
                        ) -
                          data.items.reduce(
                            (sum, item) =>
                              sum +
                              item.qty *
                                (item.selectedSubcategory &&
                                typeof item.selectedSubcategory.price ===
                                  'number'
                                  ? item.selectedSubcategory.price
                                  : item.foodPrice),
                            0,
                          ) *
                            (data.discountRate / 100)) *
                        (data.taxRate / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Manual Rounding
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      {data.manualRounding >= 0 ? '+ ' : '- '}Rs.{' '}
                      {Math.abs(data.manualRounding).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right">
                      Delivery Fee
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      + Rs. {(data.deliveryFee || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-gray-500 text-xs text-left">
                      Processed By: {data.processedBy}
                    </TableCell>
                    <TableCell className="font-semibold text-right">
                      Total
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      Rs.
                      {(
                        (data.items.reduce(
                          (sum, item) =>
                            sum +
                            item.qty *
                              (item.selectedSubcategory &&
                              typeof item.selectedSubcategory.price === 'number'
                                ? item.selectedSubcategory.price
                                : item.foodPrice),
                          0,
                        ) -
                          data.items.reduce(
                            (sum, item) =>
                              sum +
                              item.qty *
                                (item.selectedSubcategory &&
                                typeof item.selectedSubcategory.price ===
                                  'number'
                                  ? item.selectedSubcategory.price
                                  : item.foodPrice),
                            0,
                          ) *
                            (data.discountRate / 100)) *
                          (1 + data.taxRate / 100) +
                        (data.manualRounding || 0)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {/* Order Meta Info below Processed By */}
              <div className="space-y-1 mt-4 text-xs">
                {data.remarks && (
                  <div>
                    <span className="font-semibold">Remarks:</span>{' '}
                    {data.remarks}
                  </div>
                )}
                {data.creditor && (
                  <div>
                    <span className="font-semibold">Creditor:</span>{' '}
                    {data.creditor}
                  </div>
                )}
                {data.complementary && (
                  <div>
                    <span className="font-semibold text-green-600">
                      Complementary
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
