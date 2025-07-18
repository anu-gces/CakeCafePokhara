import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2Icon, LoaderIcon, Trash2Icon } from 'lucide-react'
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
import SplashScreen from '@/components/splashscreen'
import {
  deleteSalaryLedgerPayment,
  enterSalaryLedgerPayment,
  getSalaryLedgerPayments,
  getSingleUser,
} from '@/firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
import { ScrollArea } from '@radix-ui/react-scroll-area'

export const Route = createFileRoute('/home/employee/$salaryLedger')({
  component: RouteComponent,
})

function RouteComponent() {
  const { salaryLedger } = Route.useParams()
  const { user: userAuth, userAdditional } = useFirebaseAuth()
  const loggedinUser = { ...userAuth, ...userAdditional }

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userManagement', salaryLedger],
    queryFn: ({ queryKey }) => getSingleUser(queryKey[1]),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const {
    data: payments = [],
    isLoading: isPaymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: ['salaryLedger', salaryLedger],
    queryFn: () => getSalaryLedgerPayments(salaryLedger),
    enabled: !!salaryLedger,
    staleTime: 1000 * 60 * 5, // 5 minutes, adjust as needed
  })

  if (isLoading || isPaymentsLoading) {
    return <SplashScreen />
  }
  if (error || paymentsError) {
    return (
      <div className="text-red-500 text-center">
        Error loading salary ledger: {error?.message || paymentsError?.message}
      </div>
    )
  }

  return (
    <div className="mx-auto px-7 py-6 pb-9 max-w-xl min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/home/employee/table"
            className="flex justify-center items-center bg-muted hover:bg-muted/80 rounded-full w-8 h-8 transition-colors"
            viewTransition={{ types: ['slide-right'] }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-primary text-2xl">Salary Ledger</h1>
        </div>
        {loggedinUser?.role !== 'employee' && (
          <LedgerDrawer salary={user?.salary || 0} />
        )}
      </div>

      <div className="flex flex-col items-center mb-6">
        <Avatar className="mb-2 w-12 h-12">
          <AvatarImage
            src={user?.photoURL || undefined}
            alt={user?.firstName + ' ' + user?.lastName}
          />
          <AvatarFallback>
            {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
          </AvatarFallback>
        </Avatar>
        <div className="font-semibold text-primary text-lg">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="text-muted-foreground text-xs">{user?.email}</div>
        <div className="text-xs">
          <span className="font-semibold">Role:</span> <span>{user?.role}</span>
        </div>
        <div className="text-xs">
          <span className="font-semibold">Department:</span>{' '}
          <span>{user?.department}</span>
        </div>
        {userAuth?.metadata?.creationTime && (
          <div className="text-xs">
            <span className="font-semibold">Join Date:</span>{' '}
            <span>
              {new Date(userAuth.metadata.creationTime).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {payments.length === 0 ? (
          <div className="text-muted-foreground text-center">
            No salary payments found.
          </div>
        ) : (
          <AnimatePresence>
            <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm mb-6 border-primary/10 dark:border-zinc-700 border-b">
              <div className="mx-auto px-7 py-4 max-w-xl">
                <motion.div
                  className="hover:bg-white/30 dark:hover:bg-zinc-800/30 bg-gradient-to-r from-primary/10 dark:from-primary/20 to-primary/5 dark:to-primary/10 hover:shadow-lg hover:backdrop-blur-md p-3 border border-primary/20 hover:border-primary/40 dark:hover:border-zinc-600 rounded-lg transition-all duration-300"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary text-sm">
                        Total Paid
                      </span>
                    </div>
                    <div className="font-bold text-primary text-lg">
                      Rs.{' '}
                      {payments
                        .reduce((sum, p) => sum + Number(p.amount), 0)
                        .toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    {payments.length} payments • Last updated{' '}
                    {new Date().toLocaleDateString()}
                  </div>
                </motion.div>
              </div>
            </div>
            {payments.map((payment, i) => (
              <motion.div key={payment.id} layout className="relative">
                <div
                  key={payment.date + payment.amount}
                  className="relative bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg px-6 py-5 border border-primary/10 dark:border-zinc-700 rounded-xl transition"
                >
                  {/* Timeline dot */}
                  <div className="top-7 -left-4 absolute bg-primary shadow border-2 border-white dark:border-zinc-900 rounded-full w-3 h-3" />
                  {/* Timeline line */}
                  {i !== payments.length - 1 && (
                    <div className="top-10 -left-[10px] absolute dark:bg-zinc-700 bg-border w-[1px] h-[calc(100%-2.5rem)]" />
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-primary text-lg">
                      Rs.{payment.amount}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(payment.date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-muted-foreground text-xs">
                    <span>
                      Paid by:{' '}
                      <span className="font-semibold">{payment.paidBy}</span>
                    </span>
                    {payment.paymentMethod && (
                      <span>
                        Method:{' '}
                        <span className="font-semibold">
                          {payment.paymentMethod}
                        </span>
                      </span>
                    )}
                    {payment.reference && (
                      <span>
                        Ref:{' '}
                        <span className="font-semibold">
                          {payment.reference}
                        </span>
                      </span>
                    )}
                  </div>
                  {payment.notes && (
                    <div className="mb-1 text-muted-foreground text-xs italic">
                      {payment.notes}
                    </div>
                  )}
                </div>
                <div
                  className="top-1/2 -right-6 absolute text-red-500 hover:text-red-700 active:scale-95 -translate-y-1/2"
                  title="Delete payment"
                >
                  {loggedinUser?.role !== 'employee' && (
                    <DeletePaymentDrawer paymentId={payment.id} />
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

const DeletePaymentDrawer = ({ paymentId }: { paymentId: string }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { salaryLedger } = Route.useParams()

  const deleteMutation = useMutation({
    mutationFn: deleteSalaryLedgerPayment,

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
                },
              })
            }
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2Icon
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
  amount: Yup.number()
    .transform((value, originalValue) =>
      typeof originalValue === 'string' && isNaN(Number(originalValue))
        ? NaN
        : value,
    )
    .strict(true) // disables type coercion
    .typeError('must be a number')
    .positive('Amount must be greater than zero')
    .required(`must be a number and can't be empty`),
  date: Yup.string().required('Required'),
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
    mutationFn: enterSalaryLedgerPayment,

    onError: (error) => {
      toast.error(`Error adding payment: ${error.message}`)
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
            amount: salary,
            date: '',
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
                  toast.success('Payment added successfully!')
                },
              },
            )
          }}
        >
          {({ setFieldValue, values }) => (
            <Form className="space-y-2 p-4">
              <ScrollArea className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Field
                    as={Input}
                    id="amount"
                    name="amount"
                    type="number"
                    required
                  />
                  <ErrorMessage
                    name="amount"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <DatePickerWithPresets
                    selected={values.date ? new Date(values.date) : undefined}
                    onSelect={(date) =>
                      setFieldValue(
                        'date',
                        date ? date.toLocaleDateString('en-CA') : '',
                      )
                    }
                  />
                  <ErrorMessage
                    name="date"
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
                  <Field as={Input} id="paymentMethod" name="paymentMethod" />
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
