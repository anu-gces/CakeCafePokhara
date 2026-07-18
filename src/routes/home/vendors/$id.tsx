import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, LoaderIcon, ReceiptIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, startOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useState } from 'react'

import { api } from '../../../../convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import type { Id } from '../../../../convex/_generated/dataModel'

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
import { ScrollArea } from '@/components/ui/scroll-area'

export const Route = createFileRoute('/home/vendors/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { id } = Route.useParams()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )

  const entries =
    useQuery(api.restaurant.expenseLedger.listLedgerByVendor, {
      vendorId: id as Id<'vendors'>,
      date: startOfDay(selectedDate!).getTime(),
    }) ?? []

  const creditedTotal = entries
    .filter((e) => e.status === 'credited')
    .reduce((sum, e) => sum + e.price * e.quantity, 0)

  return (
    <ScrollArea className="h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="mx-auto px-4 pt-4 pb-4 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() =>
                navigate({
                  to: '/home',
                  viewTransition: { types: ['slide-right'] },
                })
              }
              variant="ghost"
              className="flex items-center gap-1.5 px-0 text-muted-foreground"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </Button>
          </div>

          <h1 className="mb-3 font-bold text-primary text-2xl capitalize">
            {entries[0]?.vendor?.name ?? 'Vendor'} Profile
          </h1>

          {/* Summary card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Unpaid total
                </span>
              </div>
              <span className="font-bold text-primary text-lg">
                Rs. {creditedTotal.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 border-border border-t">
              <div className="px-4 py-2.5 border-border border-r">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Entries
                </div>
                <div className="font-semibold text-foreground text-lg">
                  {entries.length}
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="mb-0.5 text-[10px] text-muted-foreground">
                  Credited
                </div>
                <div className="font-semibold text-amber-600 dark:text-amber-400 text-lg">
                  {entries.filter((e) => e.status === 'credited').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-3 pb-20 max-w-xl">
        {/* Filter row */}
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
          {entries && entries.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-30 mb-3 w-10 h-10" />
              <p className="text-sm">No entries for this date.</p>
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
                  {/* Timeline dot */}
                  <div className="top-5 -left-3.5 absolute bg-primary border-2 rounded-full w-2.5 h-2.5" />
                  {i !== entries.length - 1 && (
                    <div className="top-8 -left-[9px] absolute dark:bg-zinc-700 bg-border w-px h-[calc(100%-1.5rem)]" />
                  )}

                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 px-4 pt-3 pb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">
                          {entry.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {format(new Date(entry.date), 'dd MMM yyyy, hh:mm a')}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          created by{' '}
                          <span className="font-medium text-foreground">
                            {entry.createdBy?.name}
                          </span>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            Vendor{' '}
                            <span className="font-medium text-foreground">
                              {entry.vendor?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            entry.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {entry.status === 'paid' ? 'Paid' : 'Credited'}
                        </span>
                        <DeleteExpenseDrawer id={entry._id} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex gap-4 px-4 py-2.5 border-border border-t">
                      <span className="text-muted-foreground text-xs">
                        Qty:{' '}
                        <span className="font-medium text-foreground">
                          {entry.quantity}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Price:{' '}
                        <span className="font-medium text-foreground">
                          Rs. {entry.price.toFixed(2)}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Total:{' '}
                        <span className="font-medium text-foreground">
                          Rs. {(entry.quantity * entry.price).toFixed(2)}
                        </span>
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-4 py-2.5 border-border border-t">
                      <span className="text-[10px] text-muted-foreground italic">
                        {entry.remarks ? `"${entry.remarks}"` : ''}
                      </span>
                      {entry.status === 'credited' && (
                        <MarkAsPaidDrawer id={entry._id} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

export function MarkAsPaidDrawer({ id }: { id: Id<'expenseLedger'> }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const markAsPaidLedger = useMutation(api.restaurant.expenseLedger.markAsPaid)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await markAsPaidLedger({ id })
      toast.success('Succesfully Marked as Paid')
      setOpen(false)
    } catch {
      toast.error('Failed to mark as Paid')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>Mark as Paid</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Mark as Paid?</DrawerTitle>
          <DrawerDescription>This action can't be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                Marking...
              </>
            ) : (
              'Mark as Paid'
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

function DeleteExpenseDrawer({ id }: { id: Id<'expenseLedger'> }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteLedger = useMutation(api.restaurant.expenseLedger.deleteLedger)

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
