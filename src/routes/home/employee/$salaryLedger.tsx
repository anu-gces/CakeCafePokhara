import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, LoaderIcon, Trash2Icon, WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { motion, AnimatePresence } from 'motion/react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { usePocketbaseAuth, type User } from '@/lib/usePocketbaseAuth'
import { pb } from '@/lib/pocketbase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'

export const Route = createFileRoute('/home/employee/$salaryLedger')({
  component: RouteComponent,
})

type SalaryLedgerData = {
  id: string
  userId: string
  amountPaid: number
  datePaid: string
  paidBy: string
  paymentMethod?: string
  reference?: string
  notes?: string
  created: string
}

function RouteComponent() {
  const { salaryLedger } = Route.useParams()
  const { user: loggedInUser } = usePocketbaseAuth()

  const { data: employeeData, isLoading: isEmployeeLoading } = useQuery<User>({
    queryKey: ['user', salaryLedger],
    queryFn: async () => pb.collection('users').getOne(salaryLedger),
    enabled: !!salaryLedger,
  })

  const { data: salaryLedgerData = [], isLoading: isSalaryLoading } = useQuery({
    queryKey: ['salaryLedger', salaryLedger],
    queryFn: async () =>
      pb.collection('salaryLedger').getFullList<SalaryLedgerData>({
        sort: '-created',
        filter: `userId = "${salaryLedger}"`,
      }),
  })

  const isLoading = isEmployeeLoading || isSalaryLoading

  const totalPaid = salaryLedgerData.reduce(
    (sum, p) => sum + Number(p.amountPaid),
    0,
  )

  const initials = employeeData
    ? `${employeeData.firstName?.[0] ?? ''}${employeeData.lastName?.[0] ?? ''}`.toUpperCase()
    : '??'

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-4 pt-4 pb-4 max-w-xl">
          {/* Back */}
          <Link
            to="/home/employee/table"
            className="inline-flex items-center gap-1 mb-4 text-muted-foreground"
            viewTransition={{ types: ['slide-right'] }}
          >
            <ArrowLeft size={16} />
            <span className="text-xs">Back</span>
          </Link>

          {/* Profile card */}
          <div className="bg-white dark:bg-zinc-900 mb-3 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage
                  src={
                    employeeData
                      ? pb.files.getURL(employeeData, employeeData.avatar)
                      : undefined
                  }
                  alt={
                    employeeData
                      ? `${employeeData.firstName} ${employeeData.lastName}`
                      : ''
                  }
                />
                <AvatarFallback className="bg-violet-100 dark:bg-violet-900/40 font-semibold text-violet-700 dark:text-violet-300 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-base truncate leading-tight">
                  {employeeData
                    ? `${employeeData.firstName} ${employeeData.lastName}`
                    : '...'}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground capitalize">
                  {employeeData?.role}
                  {employeeData?.department
                    ? ` · ${employeeData.department}`
                    : ''}
                </div>
                {employeeData?.email && (
                  <div className="text-[10px] text-muted-foreground truncate">
                    {employeeData.email}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  base salary
                </div>
                <div className="font-semibold text-foreground text-base leading-tight">
                  Rs. {(employeeData?.salary ?? 0).toLocaleString()}
                </div>
                {employeeData?.created && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    since {format(new Date(employeeData.created), 'MMM yyyy')}
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 border-border border-t">
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Payments
                </div>
                <div className="font-semibold text-foreground text-lg">
                  {salaryLedgerData.length}
                </div>
              </div>
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Total paid
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400 text-base">
                  Rs. {totalPaid.toLocaleString()}
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Last paid
                </div>
                <div className="font-semibold text-foreground text-sm">
                  {salaryLedgerData[0]
                    ? format(new Date(salaryLedgerData[0].datePaid), 'dd MMM')
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Add button for non-employees */}
          {loggedInUser?.role !== 'employee' && (
            <LedgerDrawer salary={employeeData?.salary || 0} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-3 pb-20 max-w-xl">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-muted-foreground text-xs">
            {salaryLedgerData.length} payments
          </span>
          {isLoading && (
            <LoaderIcon className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        <div className="space-y-2">
          {!isLoading && salaryLedgerData.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground text-center">
              <WalletIcon className="opacity-30 mb-3 w-10 h-10" />
              <p className="text-sm">No payments recorded yet.</p>
            </div>
          ) : (
            <AnimatePresence>
              {salaryLedgerData.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className="top-5 -left-3.5 absolute bg-primary border-2 border-white dark:border-zinc-900 rounded-full w-2.5 h-2.5" />
                  {/* Timeline line */}
                  {i !== salaryLedgerData.length - 1 && (
                    <div className="top-8 -left-[9px] absolute dark:bg-zinc-700 bg-border w-px h-[calc(100%-1.5rem)]" />
                  )}

                  <div className="relative bg-white dark:bg-zinc-900 border border-border rounded-xl overflow-hidden">
                    {/* Main row */}
                    <div className="flex justify-between items-start gap-3 px-4 pt-3 pb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-base">
                          Rs. {Number(payment.amountPaid).toLocaleString()}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          Paid by {payment.paidBy}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-foreground text-sm">
                          {format(new Date(payment.datePaid), 'dd MMM yyyy')}
                        </div>
                        {payment.paymentMethod && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground capitalize">
                            {payment.paymentMethod}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer row */}
                    {(payment.reference || payment.notes) && (
                      <div className="flex justify-between items-center px-4 py-2 border-border border-t">
                        {payment.reference && (
                          <span className="text-[10px] text-muted-foreground">
                            Ref: {payment.reference}
                          </span>
                        )}
                        {payment.notes && (
                          <span className="max-w-[180px] text-[10px] text-muted-foreground truncate italic">
                            "{payment.notes}"
                          </span>
                        )}
                      </div>
                    )}

                    {/* Delete button for managers/owners */}
                    {loggedInUser?.role !== 'employee' && (
                      <div className="px-4 pt-0 pb-3">
                        <DeletePaymentDrawer paymentId={payment.id} />
                      </div>
                    )}
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

const DeletePaymentDrawer = ({ paymentId }: { paymentId: string }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { salaryLedger } = Route.useParams()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await pb.collection('salaryLedger').delete(id)
    },

    onError: (error) => {
      toast.error(`Error deleting payment: ${error.message}`)
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
          <DrawerTitle>Delete Payment</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this payment?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            className="bg-primary"
            onClick={() =>
              deleteMutation.mutate(paymentId, {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ['salaryLedger', salaryLedger],
                  })
                  setOpen(false)
                  toast.success('Record deleted successfully!')
                },
              })
            }
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
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
  amountPaid: Yup.number()
    .transform((value, originalValue) =>
      typeof originalValue === 'string' && isNaN(Number(originalValue))
        ? NaN
        : value,
    )
    .strict(true) // disables type coercion
    .typeError('must be a number')
    .positive('Amount must be greater than zero')
    .required(`must be a number and can't be empty`),
  datePaid: Yup.string().required('Required'),
  paidBy: Yup.string().required('Required'),
  paymentMethod: Yup.string(),
  reference: Yup.string(),
  notes: Yup.string(),
})

function LedgerDrawer({ salary }: { salary: number }) {
  const [open, setOpen] = useState(false)
  const { salaryLedger } = Route.useParams()

  const queryClient = useQueryClient()

  const enterPaymentMutation = useMutation({
    mutationFn: async (values: any) => {
      return await pb.collection('salaryLedger').create({
        userId: salaryLedger,
        amountPaid: values.amountPaid,
        datePaid: values.datePaid,
        paidBy: values.paidBy,
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        notes: values.notes,
      })
    },

    onError: (error) => {
      toast.error(`Error adding record: ${error.message}`)
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
        <Button variant="default">Add Entry</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Salary Entry</DrawerTitle>
          <DrawerDescription>
            Enter details for the new salary payment.
          </DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={{
            amountPaid: salary,
            datePaid: '',
            paidBy: '',
            paymentMethod: 'cash',
            reference: '',
            notes: '',
          }}
          validationSchema={LedgerSchema}
          onSubmit={(values, { resetForm }) => {
            enterPaymentMutation.mutate(
              {
                ...values,
                userUid: salaryLedger,
              },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ['salaryLedger', salaryLedger],
                  })
                  setOpen(false)
                  resetForm()
                  toast.success('Record added successfully!')
                },
              },
            )
          }}
        >
          {({ setFieldValue, values }) => (
            <Form>
              <ScrollArea className="space-y-2 p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Amount</Label>
                  <Field
                    as={Input}
                    id="amountPaid"
                    name="amountPaid"
                    type="number"
                    required
                  />
                  <ErrorMessage
                    name="amountPaid"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datePaid">Date</Label>
                  <DatePickerWithPresets
                    selected={
                      values.datePaid ? new Date(values.datePaid) : undefined
                    }
                    onSelect={(date) =>
                      setFieldValue(
                        'datePaid',
                        date ? date.toLocaleDateString('en-CA') : '',
                      )
                    }
                  />
                  <ErrorMessage
                    name="datePaid"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidBy">Paid By</Label>
                  <Field as={Input} id="paidBy" name="paidBy" required />
                  <ErrorMessage
                    name="paidBy"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>

                  <Select
                    value={values.paymentMethod}
                    onValueChange={(value) =>
                      setFieldValue('paymentMethod', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="esewa">eSewa</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>

                  <ErrorMessage
                    name="paymentMethod"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Field as={Input} id="reference" name="reference" />
                  <ErrorMessage
                    name="reference"
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
              </ScrollArea>
              <DrawerFooter>
                <Button type="submit" disabled={enterPaymentMutation.isPending}>
                  {enterPaymentMutation.isPending ? (
                    <>
                      <LoaderIcon
                        color="white"
                        className="mr-2 w-4 h-4 animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    'Save'
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
