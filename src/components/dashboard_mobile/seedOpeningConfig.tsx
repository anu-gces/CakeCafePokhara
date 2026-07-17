import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  CheckCircle2Icon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
  StoreIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import type { Doc } from '../../../convex/_generated/dataModel'

const SeedOpeningConfig = ({
  selectedBranch,
}: {
  selectedBranch: Doc<'branches'>
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const seedBalance = useQuery(api.dashboard.seedBalance.getSeedBalance, {
    branchId: selectedBranch._id,
  })

  const isLoading = seedBalance === undefined

  const setSeedBalance = useMutation(api.dashboard.seedBalance.setSeedBalance)
  const clearSeedBalance = useMutation(
    api.dashboard.seedBalance.clearSeedBalance,
  )

  const handleEdit = () => {
    if (seedBalance) {
      setAmount(String(seedBalance.amount))
      setSelectedDate(new Date(seedBalance.date))
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setAmount('')
    setSelectedDate(undefined)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!amount || !selectedDate) return

    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error('Enter a valid amount')
      return
    }

    setIsSaving(true)
    try {
      await setSeedBalance({
        branchId: selectedBranch._id,
        amount: parsedAmount,
        date: selectedDate.getTime(),
      })
      toast.success(
        seedBalance ? 'Opening balance updated' : 'Opening balance set',
      )
      setAmount('')
      setSelectedDate(undefined)
      setIsEditing(false)
    } catch (err) {
      toast.error('Failed to save opening balance')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await clearSeedBalance({ branchId: selectedBranch._id })
      toast.success('Opening balance removed')
    } catch (err) {
      toast.error('Failed to remove opening balance')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoaderIcon className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto px-4 pt-6 pb-10 w-full sm:w-[480px] lg:w-[540px]">
      {/* Page heading */}
      <div className="flex justify-between items-end gap-3 mb-6">
        <div>
          <p className="mb-1 text-muted-foreground text-xs uppercase tracking-widest">
            Configuration
          </p>
          <h1 className="font-semibold text-foreground text-xl tracking-tight">
            Opening Balance
          </h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!seedBalance && !isEditing && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-4 bg-muted/30 px-5 py-10 border border-border border-dashed rounded-xl text-center">
              <p className="text-muted-foreground text-sm leading-relaxed">
                No opening balance set yet for{' '}
                <span className="font-medium text-foreground">
                  {selectedBranch.name}
                </span>
                . <br />
                Add one to start tracking daily cash flow.
              </p>
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <PlusIcon color="white" className="w-3.5 h-3.5" />
                Set opening balance
              </Button>
            </div>
          </motion.div>
        )}

        {seedBalance && !isEditing && (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="mb-1 text-muted-foreground text-xs">
                      Seed amount
                    </p>
                    <p className="font-semibold text-foreground text-3xl tracking-tight">
                      Rs. {seedBalance.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 mt-0.5 text-xs"
                  >
                    <CheckCircle2Icon className="w-3 h-3" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
                  <CalendarIcon className="flex-shrink-0 w-3.5 h-3.5" />
                  <span className="text-sm">
                    {format(new Date(seedBalance.date), 'MMM d, yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                  <StoreIcon className="flex-shrink-0 w-3.5 h-3.5" />
                  <span className="text-sm">{selectedBranch.name}</span>
                </div>
              </div>

              <Separator />

              <div className="flex divide-x divide-border">
                <button
                  onClick={handleEdit}
                  className="flex flex-1 justify-center items-center gap-2 hover:bg-muted/40 active:bg-muted/60 py-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex flex-1 justify-center items-center gap-2 hover:bg-destructive/5 active:bg-destructive/10 disabled:opacity-40 py-3 text-muted-foreground hover:text-destructive text-sm transition-colors"
                >
                  {isDeleting ? (
                    <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2Icon className="w-3.5 h-3.5" />
                  )}
                  {isDeleting ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>

            <p className="mt-3 px-1 text-muted-foreground text-xs leading-relaxed">
              Daily opening balances chain forward from this date automatically.
            </p>
          </motion.div>
        )}

        {isEditing && (
          <motion.div
            key="editing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <p className="font-medium text-foreground text-sm">
                  {seedBalance ? 'Edit balance' : 'Set opening balance'}
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Starting point for all daily calculations —{' '}
                  {selectedBranch.name}.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="space-y-1.5">
                  <label className="font-medium text-muted-foreground text-xs">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="top-1/2 left-3 absolute text-muted-foreground text-sm -translate-y-1/2 pointer-events-none select-none">
                      Rs.
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10 text-base"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="mr-2 font-medium text-muted-foreground text-xs">
                    Starting date
                  </label>
                  <DatePickerWithPresets
                    className="w-48"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex divide-x divide-border">
                <button
                  onClick={handleCancel}
                  className="flex flex-1 justify-center items-center gap-2 hover:bg-muted/40 active:bg-muted/60 py-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !amount || !selectedDate}
                  className="flex flex-1 justify-center items-center gap-2 hover:bg-muted/40 active:bg-muted/60 disabled:opacity-40 py-3 font-medium text-foreground text-sm transition-colors"
                >
                  {isSaving ? (
                    <>
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-4 h-4" />
                      {seedBalance ? 'Update' : 'Save'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SeedOpeningConfig
