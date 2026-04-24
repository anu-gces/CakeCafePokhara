'use client'

import { useState } from 'react'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CalendarIcon,
  CheckCircle2Icon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { pb } from '@/lib/pocketbase'

export interface SeedBalance {
  id: string
  seedAmount: number
  seedDate: string
}

interface SeedBalancePayload {
  amount: number
  date: string
}

const COLLECTION = 'seedConfig'

async function getSeedBalance(): Promise<SeedBalance | null> {
  try {
    const records = await pb.collection(COLLECTION).getList<SeedBalance>(1, 1)
    if (records.items.length === 0) return null
    const r = records.items[0]
    return { id: r.id, seedAmount: r.seedAmount, seedDate: r.seedDate }
  } catch {
    return null
  }
}

async function setSeedBalance(
  payload: SeedBalancePayload,
  existingId?: string,
): Promise<SeedBalance> {
  const data = {
    seedAmount: payload.amount,
    seedDate: new Date(payload.date).toISOString(),
  }
  if (existingId) {
    const r = await pb
      .collection(COLLECTION)
      .update<SeedBalance>(existingId, data)
    return { id: r.id, seedAmount: r.seedAmount, seedDate: r.seedDate }
  }
  const r = await pb.collection(COLLECTION).create<SeedBalance>(data)
  return { id: r.id, seedAmount: r.seedAmount, seedDate: r.seedDate }
}

async function deleteSeedBalance(id: string): Promise<void> {
  await pb.collection(COLLECTION).delete(id)
}

const SeedOpeningConfig = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const queryClient = useQueryClient()

  const { data: seedBalance, isLoading } = useQuery({
    queryKey: ['seedBalance'],
    queryFn: getSeedBalance,
  })

  const createMutation = useMutation({
    mutationFn: (payload: SeedBalancePayload) =>
      setSeedBalance(payload, seedBalance?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seedBalance'] })
      setIsEditing(false)
      setAmount('')
      setSelectedDate(undefined)
      toast.success('Opening balance saved')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSeedBalance(seedBalance!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seedBalance'] })
      toast.success('Opening balance removed')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSave = () => {
    if (!amount || !selectedDate) {
      toast.error('Fill in all fields')
      return
    }
    createMutation.mutate({
      amount: Number.parseFloat(amount),
      date: format(selectedDate, 'yyyy-MM-dd'),
    })
  }

  const handleEdit = () => {
    if (seedBalance) {
      setAmount(seedBalance.seedAmount.toString())
      setSelectedDate(new Date(seedBalance.seedDate))
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAmount('')
    setSelectedDate(undefined)
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
      <div className="mb-6">
        <p className="mb-1 text-muted-foreground text-xs uppercase tracking-widest">
          Configuration
        </p>
        <h1 className="font-semibold text-foreground text-xl tracking-tight">
          Opening Balance
        </h1>
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
                No opening balance set yet. <br />
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
                      Rs. {seedBalance.seedAmount.toLocaleString('en-IN')}
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
                    {format(new Date(seedBalance.seedDate), 'MMM d, yyyy')}
                  </span>
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
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex flex-1 justify-center items-center gap-2 hover:bg-destructive/5 active:bg-destructive/10 disabled:opacity-40 py-3 text-muted-foreground hover:text-destructive text-sm transition-colors"
                >
                  {deleteMutation.isPending ? (
                    <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2Icon className="w-3.5 h-3.5" />
                  )}
                  {deleteMutation.isPending ? 'Removing…' : 'Remove'}
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
                  Starting point for all daily calculations.
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
                  <label className="font-medium text-muted-foreground text-xs">
                    Starting date
                  </label>
                  <DatePickerWithPresets
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex divide-x divide-border">
                <button
                  onClick={handleCancel}
                  className="flex-1 hover:bg-muted/40 active:bg-muted/60 py-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending || !amount || !selectedDate
                  }
                  className="flex flex-1 justify-center items-center gap-2 hover:bg-muted/40 active:bg-muted/60 disabled:opacity-40 py-3 font-medium text-foreground text-sm transition-colors"
                >
                  {createMutation.isPending && (
                    <LoaderIcon
                      color="white"
                      className="w-3.5 h-3.5 animate-spin"
                    />
                  )}
                  {createMutation.isPending
                    ? 'Saving…'
                    : seedBalance
                      ? 'Update'
                      : 'Save'}
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
