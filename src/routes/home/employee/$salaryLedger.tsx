import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  LoaderIcon,
  PlusIcon,
  ReceiptIcon,
  Trash2Icon,
  UserXIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, startOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useState } from 'react'

import { api } from '../../../../convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionArgs } from 'convex/server'
import type { Id } from '../../../../convex/_generated/dataModel'
import z from 'zod'
import { useForm } from '@tanstack/react-form'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import { Textarea } from '@/components/ui/textarea'
import { SplashScreen } from '@/components/splashscreen'

export const Route = createFileRoute('/home/employee/$salaryLedger')({
  component: RouteComponent,
})

function RouteComponent() {
  const { salaryLedger } = Route.useParams()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )

  const targetUser = useQuery(api.users.getUserById, {
    id: salaryLedger as Id<'users'>,
  })

  const entries =
    useQuery(api.salaryLedger.salaryLedger.listSalaryLedger, {
      id: salaryLedger as Id<'users'>,
      date: startOfDay(selectedDate!).getTime(),
    }) ?? []

  if (targetUser === undefined) {
    return <SplashScreen />
  }

  if (targetUser === null) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 p-8 h-full text-zinc-400 text-center">
        <UserXIcon className="w-5 h-5 text-zinc-500" />
        <span className="font-medium text-zinc-200 text-sm">
          Staff member not found
        </span>
        <button
          onClick={() => window.history.back()}
          className="mt-2 text-zinc-500 hover:text-zinc-300 text-xs underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const totalBasePay = entries.reduce((sum, e) => sum + e.basePay, 0)
  const totalBonus = entries.reduce((sum, e) => sum + e.tipsAndBonus, 0)
  const totalDeductions = entries.reduce((sum, e) => sum + e.deductions, 0)
  const totalNetPay = entries.reduce(
    (sum, e) => sum + e.basePay + e.tipsAndBonus - e.deductions,
    0,
  )

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-4 pt-4 pb-4 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() =>
                navigate({
                  to: '/home/takeOrder',
                  search: { category: 'appetizers' },
                  viewTransition: { types: ['slide-right'] },
                })
              }
              variant="ghost"
              className="flex items-center gap-1.5 px-0 text-muted-foreground"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </Button>

            <CreateSalaryLedgerDrawer />
          </div>

          <h1 className="mb-3 font-bold text-primary text-2xl capitalize">
            {targetUser.name} Salary Ledger
          </h1>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Net Salary
                </span>
              </div>
              <span className="font-bold text-primary text-lg">
                Rs. {totalNetPay.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-4 border-border border-t">
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Entries
                </div>
                <div className="font-semibold text-foreground text-lg">
                  {entries.length}
                </div>
              </div>

              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Base
                </div>
                <div className="font-semibold text-foreground text-lg">
                  Rs. {totalBasePay.toFixed(2)}
                </div>
              </div>

              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Bonus
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400 text-lg">
                  Rs. {totalBonus.toFixed(2)}
                </div>
              </div>

              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Deduct
                </div>
                <div className="font-semibold text-red-600 dark:text-red-400 text-lg">
                  Rs. {totalDeductions.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-3 pb-20 max-w-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">
              {entries.length} entries
            </span>
            {!entries && (
              <LoaderIcon className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>

          <DatePickerWithPresets
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-30 mb-3 w-10 h-10" />
              <p className="text-sm">No salary records for this date.</p>
            </div>
          ) : (
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="relative"
                >
                  <div className="top-5 -left-3.5 absolute bg-primary border-2 rounded-full w-2.5 h-2.5" />

                  {i !== entries.length - 1 && (
                    <div className="top-8 -left-[9px] absolute dark:bg-zinc-700 bg-border w-px h-[calc(100%-1.5rem)]" />
                  )}

                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 px-4 pt-3 pb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm">
                          Salary Entry
                        </div>

                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {format(
                            new Date(entry.paidAt ?? entry._creationTime),
                            'dd MMM yyyy, hh:mm a',
                          )}
                        </div>
                      </div>

                      <DeleteSalaryLedgerDrawer id={entry._id} />
                    </div>

                    {/* Details */}
                    <div className="gap-x-4 gap-y-2 grid grid-cols-2 px-4 py-3 border-border border-t text-xs">
                      <div>
                        <span className="text-muted-foreground">Base Pay</span>
                        <div className="font-medium text-foreground">
                          Rs. {entry.basePay.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Tips & Bonus
                        </span>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          Rs. {entry.tipsAndBonus.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Deductions
                        </span>
                        <div className="font-medium text-red-600 dark:text-red-400">
                          Rs. {entry.deductions.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Net Salary
                        </span>
                        <div className="font-semibold text-primary">
                          Rs.{' '}
                          {(
                            entry.basePay +
                            entry.tipsAndBonus -
                            entry.deductions
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-4 py-2.5 border-border border-t">
                      <span className="text-[10px] text-muted-foreground italic">
                        {entry.remarks ? `"${entry.remarks}"` : ''}
                      </span>
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

type SalaryLedger = FunctionArgs<
  typeof api.salaryLedger.salaryLedger.createSalaryLedger
>

type CreateSalaryLedger = Omit<
  SalaryLedger,
  'paidAt' | 'basePay' | 'tipsAndBonus' | 'deductions' | 'userId'
> & { paidAt: Date; basePay: string; tipsAndBonus: string; deductions: string }

const defaultExpenseValues: CreateSalaryLedger = {
  basePay: '',
  tipsAndBonus: '',
  deductions: '',
  paidAt: new Date(),
  remarks: '',
}

const amount = z.string().regex(/^[0-9]*$/, 'Only digits are allowed')

const addExpenseSchema = z.object({
  basePay: amount,
  tipsAndBonus: amount,
  deductions: amount,
  paidAt: z.date(),
  remarks: z.string().optional(),
})

function CreateSalaryLedgerDrawer() {
  const [open, setOpen] = useState(false)
  const { salaryLedger } = Route.useParams()

  const createLedger = useMutation(
    api.salaryLedger.salaryLedger.createSalaryLedger,
  )

  const form = useForm({
    defaultValues: defaultExpenseValues,
    validators: { onChange: addExpenseSchema },
    onSubmit: async ({ value }) => {
      try {
        await createLedger({
          userId: salaryLedger as Id<'users'>,
          basePay: Number(value.basePay),
          tipsAndBonus: Number(value.tipsAndBonus),
          deductions: Number(value.deductions),
          paidAt: value.paidAt.getTime(),
          remarks: value.remarks || '',
        })

        toast.success('Salary entry added')
        form.reset()
        setOpen(false)
      } catch {
        toast.error('Failed to add salary entry')
      }
    },
  })

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="flex items-center gap-2" size="sm">
          <PlusIcon color="white" className="w-4 h-4" />
          Add Entry
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Expense</DrawerTitle>
          <DrawerDescription>
            Add a new entry to the Salary ledger.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4 px-4 pb-2"
        >
          <div className="gap-3 grid grid-cols-1">
            <form.Field name="basePay">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Base Pay</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={field.state.value}
                    onChange={(e) => {
                      const value = e.target.value

                      if (!/^[0-9]*$/.test(value)) return

                      field.handleChange(value)
                    }}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="tipsAndBonus">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Tips and Bonus</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={field.state.value}
                    onChange={(e) => {
                      const value = e.target.value

                      if (!/^[0-9]*$/.test(value)) return

                      field.handleChange(value)
                    }}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div className="gap-3 grid grid-cols-2">
            <form.Field name="deductions">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Deductions</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={field.state.value}
                    onChange={(e) => {
                      const value = e.target.value

                      if (!/^[0-9]*$/.test(value)) return

                      field.handleChange(value)
                    }}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="paidAt">
              {(field) => (
                <div className="space-y-2">
                  <Label>Date Paid</Label>
                  <DatePickerWithPresets
                    className="w-48 h-10"
                    selected={field.state.value}
                    onSelect={(d) => d && field.handleChange(d)}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="remarks">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Remarks</Label>
                <Textarea
                  id={field.name}
                  rows={2}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Optional notes..."
                />
              </div>
            )}
          </form.Field>
        </form>

        <DrawerFooter>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                onClick={() => form.handleSubmit()}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Entry'
                )}
              </Button>
            )}
          </form.Subscribe>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DeleteSalaryLedgerDrawer({ id }: { id: Id<'salaryLedger'> }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteLedger = useMutation(
    api.salaryLedger.salaryLedger.deleteSalaryLedger,
  )

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteLedger({ id })
      toast.success('Entry deleted')
      setOpen(false)
    } catch {
      toast.error('Failed to delete entry')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="w-3.5 h-3.5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete entry?</DrawerTitle>
          <DrawerDescription>
            This will permanently remove this ledger entry. This can't be
            undone.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
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
