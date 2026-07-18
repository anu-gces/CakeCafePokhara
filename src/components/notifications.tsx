import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import {
  XIcon,
  CheckIcon,
  LoaderIcon,
  CheckCircle2Icon,
  PlusIcon,
} from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { ReceiptDrawer } from './restaurant_mobile/receiptDrawer'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer'
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Input } from './ui/input'

type OrderTicketWithItems = Doc<'orderTickets'> & {
  items: Doc<'orderItems'>[]
}
type OrderItem = Doc<'orderItems'>
type Branch = Doc<'branches'>

function getNextItemStatus(
  status: OrderItem['itemStatus'],
): OrderItem['itemStatus'] | null {
  if (status === 'cooking') return 'cooked'
  if (status === 'cooked') return 'served'
  return null
}

function formatOrderDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderCard({ tickets }: { tickets: OrderTicketWithItems[] }) {
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] =
    useState<OrderTicketWithItems | null>(null)

  if (tickets.length === 0) {
    return (
      <div className="flex justify-center items-center py-16 text-muted-foreground text-sm">
        No active orders right now.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      <AnimatePresence mode="popLayout">
        {tickets.map((ticket) => (
          <motion.div
            key={ticket._id}
            layout
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 40,
              mass: 1,
            }}
          >
            <Card
              key={ticket._id}
              className="shadow-sm pb-0 border-muted/60 overflow-hidden"
            >
              <CardHeader className="bg-muted/40 p-4 pb-3.5 border-border border-b">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-1 items-start gap-3 min-w-0">
                    <div className="bg-primary shadow-sm px-2.5 py-1.5 rounded-md font-black text-primary-foreground text-sm uppercase tracking-wider shrink-0">
                      KOT: {ticket.kotNumber}
                    </div>

                    <div className="pt-0.5 min-w-0">
                      {ticket.tableNumber !== undefined ? (
                        <Badge
                          variant="secondary"
                          className="px-2 py-0.5 rounded font-bold text-xs tracking-tight"
                        >
                          Table {ticket.tableNumber}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-background px-2 py-0.5 rounded font-bold text-xs tracking-tight"
                        >
                          Takeaway
                        </Badge>
                      )}
                      <p className="mt-1 font-medium text-[10px] text-muted-foreground tracking-normal">
                        {formatOrderDate(ticket.orderDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                    <SettleOrderDrawer ticket={ticket} />
                    <CancelWholeOrderDrawer ticket={ticket} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-4 pt-3">
                {ticket.items.map((item, index) => {
                  const nextStatus = getNextItemStatus(item.itemStatus)

                  return (
                    <div key={item._id}>
                      {index > 0 ? (
                        <Separator className="opacity-60 my-3" />
                      ) : null}

                      <div className="flex justify-between items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-accent px-1.5 py-0.5 rounded min-w-[24px] font-semibold text-sm text-center text-accent-foreground">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-foreground text-sm truncate">
                              {item.name}
                            </span>
                            {item.isComplimentary && (
                              <Badge
                                variant="outline"
                                className="px-1 py-0 border-emerald-500 font-medium text-[10px] text-emerald-600"
                              >
                                Complementary
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="bg-amber-50 dark:bg-amber-950/30 mt-1 p-1.5 rounded text-amber-700 dark:text-amber-400 text-xs">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.itemStatus !== 'cancelled' && nextStatus ? (
                            <UpdateStatusDrawer ticket={ticket} item={item} />
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider"
                            >
                              {item.itemStatus}
                            </Badge>
                          )}

                          {item.itemStatus !== 'cancelled' && (
                            <VoidItemDrawer ticket={ticket} item={item} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>

              <CardFooter className="flex flex-row justify-between gap-2 py-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-semibold text-xs"
                  onClick={() => {
                    setSelectedTicket(ticket)
                    setReceiptOpen(true)
                  }}
                >
                  View Receipt
                </Button>
                <AddItemsDrawer ticket={ticket} />
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      <ReceiptDrawer
        data={selectedTicket}
        receiptOpen={receiptOpen}
        setReceiptOpen={setReceiptOpen}
      />
    </div>
  )
}

export function Notifications() {
  const branches = useQuery(api.restaurant.branches.listBranches)
  const allActiveOrders = useQuery(
    api.restaurant.notifications.getActiveNotificationFeed,
  )
  const [selectedBranchId, setSelectedBranchId] = useState<
    Id<'branches'> | undefined
  >(undefined)

  const ordersByBranch = useMemo(() => {
    if (!allActiveOrders) return undefined
    const map = new Map<Id<'branches'>, OrderTicketWithItems[]>()
    for (const ticket of allActiveOrders) {
      const existing = map.get(ticket.branchId) ?? []
      existing.push(ticket)
      map.set(ticket.branchId, existing)
    }
    return map
  }, [allActiveOrders])

  if (branches === undefined || allActiveOrders === undefined) {
    return (
      <div className="flex justify-center items-center py-16 text-muted-foreground text-sm">
        Loading orders...
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <div className="flex justify-center items-center py-16 text-muted-foreground text-sm">
        No branches found.
      </div>
    )
  }

  const activeTab = selectedBranchId ?? branches[0]._id

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setSelectedBranchId(value as Id<'branches'>)}
      className="py-4 h-full"
    >
      <div className="flex-shrink-0 bg-background px-4 py-2 border-b">
        <TabsList>
          {branches.map((branch: Branch) => (
            <TabsTrigger key={branch._id} value={branch._id}>
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {branches.map((branch: Branch) => (
        <TabsContent
          key={branch._id}
          value={branch._id}
          className="mx-auto max-w-7xl h-full"
        >
          <ScrollArea className="h-full overflow-y-auto">
            <OrderCard tickets={ordersByBranch?.get(branch._id) ?? []} />
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function SettleOrderDrawer({
  ticket,
}: {
  ticket: OrderTicketWithItems
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const settlePaid = useMutation(api.restaurant.notifications.markTicketAsPaid)
  const settlePayLater = useMutation(
    api.restaurant.notifications.markTicketAsPayLater,
  )

  // Every single item must be served or cancelled to checkout
  const canSettle = ticket.items.every(
    (item) => item.itemStatus === 'served' || item.itemStatus === 'cancelled',
  )

  const isPayLater = !!ticket.payLaterCustomerId
  const actionLabel = isPayLater ? 'Pay Later' : 'Settle Paid'

  const handleSettle = async () => {
    try {
      setIsPending(true)
      if (isPayLater) {
        await settlePayLater({ ticketId: ticket._id })
        toast.success(`KOT ${ticket.kotNumber} settled to Pay Later account.`)
      } else {
        await settlePaid({ ticketId: ticket._id })
        toast.success(`KOT ${ticket.kotNumber} marked as Paid.`)
      }
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : 'Failed to settle order',
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          size="sm"
          className="shadow-none px-2.5 h-7 font-semibold text-[11px] uppercase tracking-wider"
          disabled={!canSettle}
        >
          <CheckCircle2Icon className="stroke-white mr-1 w-3 h-3" />
          {actionLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex flex-col gap-0.5 text-left">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              KOT: {ticket.kotNumber}
            </span>
            <span className="font-bold text-lg">
              Settle order as {actionLabel}?
            </span>
          </DrawerTitle>
          <DrawerDescription>
            {isPayLater
              ? "This balance will be deferred to the customer's credit ledger account."
              : 'Confirm cash, card, or external point-of-sale receipt verification.'}
          </DrawerDescription>
        </DrawerHeader>

        <OrderSummary ticket={ticket} />

        <DrawerFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleSettle} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Settlement'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function CancelWholeOrderDrawer({ ticket }: { ticket: OrderTicketWithItems }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const cancelTicket = useMutation(
    api.restaurant.notifications.cancelWholeTicket,
  )

  const isNotActive = ticket.status !== 'active'
  const isDisabled = isNotActive || isPending

  const handleCancelTicket = async () => {
    try {
      setIsPending(true)
      await cancelTicket({ ticketId: ticket._id })
      toast.success(`KOT ${ticket.kotNumber} has been completely cancelled.`)
      setIsOpen(false)
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : 'Failed to cancel order',
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-destructive/10 rounded-md w-7 h-7 text-muted-foreground hover:text-destructive transition-all shrink-0"
          title="Cancel Order"
          disabled={isDisabled}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Are you sure you want to cancel the order of KOT: {ticket.kotNumber}
            ?
          </DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <OrderSummary ticket={ticket} />
        <DrawerFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleCancelTicket} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function VoidItemDrawer({
  ticket,
  item,
}: {
  ticket: OrderTicketWithItems
  item: OrderItem
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const cancelItem = useMutation(api.restaurant.notifications.markCancelled)
  const isDisabled = item.itemStatus === 'served' || isPending

  const handleVoidItem = async () => {
    try {
      setIsPending(true)
      await cancelItem({ orderId: item._id })
      setIsOpen(false)
      toast.success(`${item.name} removed from KOT: ${ticket.kotNumber}`)
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : 'Failed to remove item',
      )
    } finally {
      setIsPending(false)
    }
  }
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-destructive/10 rounded-md w-7 h-7 text-muted-foreground hover:text-destructive transition-all shrink-0"
          title="Cancel Order"
          disabled={isDisabled}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-medium text-base">
            Cancel{' '}
            <span className="font-bold text-foreground">{item.name}</span> from
            KOT{' '}
            <span className="font-bold text-primary">{ticket.kotNumber}</span>?
          </DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <OrderSummary ticket={ticket} />

        <DrawerFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleVoidItem} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

interface UpdateStatusDrawerProps {
  ticket: OrderTicketWithItems
  item: OrderItem
}

function UpdateStatusDrawer({ ticket, item }: UpdateStatusDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const nextStatus = getNextItemStatus(item.itemStatus) ?? 'updated'
  const actionLabel = nextStatus === 'cooked' ? 'Cooked' : 'Served'

  const markCooked = useMutation(api.restaurant.notifications.markCooked)
  const markServed = useMutation(api.restaurant.notifications.markServed)

  const handleUpdateStatus = async () => {
    try {
      setIsPending(true)

      // Select mutation based on next status target
      if (nextStatus === 'cooked') {
        await markCooked({ orderId: item._id })
      } else if (nextStatus === 'served') {
        await markServed({ orderId: item._id })
      }

      toast.success(`${item.name} marked as ${actionLabel}`)
      setIsOpen(false)
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : 'Failed to update status',
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline" disabled={isPending}>
          <CheckIcon className="mr-1 w-3.5 h-3.5" />
          Mark as {actionLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex flex-col gap-0.5 text-left">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              KOT: {ticket.kotNumber}
            </span>
            <span className="font-bold text-lg">
              Mark {item.name} as {actionLabel}?
            </span>
          </DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>

        <OrderSummary ticket={ticket} />

        <DrawerFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleUpdateStatus} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function OrderSummary({ ticket }: { ticket: OrderTicketWithItems }) {
  if (!ticket?.items || ticket.items.length === 0) return null

  return (
    <div className="px-4 py-2">
      <ScrollArea className="bg-muted/40 p-3 border border-muted/80 rounded-lg max-h-[40vh] overflow-y-auto">
        <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Order Summary ({ticket.items.length} items)
        </p>
        <div className="flex flex-col gap-2">
          {ticket.items.map((item) => (
            <div key={item._id} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-muted-foreground shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {item.name}
                  </span>
                  {item.isComplimentary && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/30 px-1 border border-emerald-200 dark:border-emerald-900 rounded font-medium text-[10px] text-emerald-600">
                      Comp
                    </span>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="bg-background px-1.5 h-5 text-[10px] uppercase tracking-wider select-none shrink-0"
                >
                  {item.itemStatus}
                </Badge>
              </div>
              {item.notes && (
                <p className="pl-7 text-amber-600 dark:text-amber-400 text-xs italic">
                  Note: {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

type AddOrderItemPayload = Pick<
  Doc<'orderItems'>,
  'itemId' | 'name' | 'price' | 'quantity'
>

export function AddItemsDrawer({ ticket }: { ticket: OrderTicketWithItems }) {
  const menuItems = useQuery(api.restaurant.menuItems.listMenuItems) ?? []
  const addItemsToOrderTicket = useMutation(
    api.restaurant.orderTickets.addItemsToOrderTicket,
  )

  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [selectedItems, setSelectedItems] = useState<
    Record<Id<'menuItems'>, AddOrderItemPayload>
  >({})
  const [search, setSearch] = useState('')

  const filteredCatalog = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setSelectedItems({})
  }

  const addItem = (
    item: Pick<Doc<'menuItems'>, '_id' | 'name' | 'price' | 'stockCount'>,
  ) => {
    setSelectedItems((prev) => {
      const current = prev[item._id]

      if ((current?.quantity ?? 0) >= item.stockCount) {
        return prev
      }

      return {
        ...prev,
        [item._id]: {
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: (current?.quantity ?? 0) + 1,
        },
      }
    })
  }

  const decrementItem = (itemId: Id<'menuItems'>) => {
    setSelectedItems((prev) => {
      const current = prev[itemId]

      if (!current) return prev

      if (current.quantity <= 1) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      }
    })
  }

  const handleAddItems = async () => {
    try {
      setIsPending(true)

      const payload: AddOrderItemPayload[] = Object.values(selectedItems)

      addItemsToOrderTicket({
        orderTicketId: ticket._id,
        items: payload.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          isComplimentary: false,
        })),
      })

      toast.success('Items ready.')
      setIsOpen(false)
    } catch {
      toast.error('Failed to prepare items.')
    } finally {
      setIsPending(false)
    }
  }

  const totalCount = Object.values(selectedItems).reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const hasStockConflict = Object.values(selectedItems).some((selected) => {
    const item = menuItems.find((menuItem) => menuItem._id === selected.itemId)

    return item && item.stockCount - selected.quantity < 0
  })

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="px-2.5 h-7 font-semibold text-xs"
        >
          <PlusIcon className="mr-1 w-3.5 h-3.5" />
          Add Items
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Add Items</DrawerTitle>
            <DrawerDescription>
              Tap to add • Tap and Hold to remove.
            </DrawerDescription>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
            />
          </DrawerHeader>

          <ScrollArea className="min-h-[35vh] max-h-[35vh]">
            {filteredCatalog.map((item) => {
              const qty = selectedItems[item._id]?.quantity ?? 0
              const remainingStock = item.stockCount - qty
              const isOutOfStock = remainingStock === 0
              const selected = qty > 0

              return (
                <div
                  key={item._id}
                  onClick={() => {
                    if (isOutOfStock || isPending) return
                    addItem(item)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    decrementItem(item._id)
                  }}
                  className={cn(
                    'relative flex justify-between items-center px-4 py-2.5 border-border/40 last:border-0 border-b transition-colors',
                    !isOutOfStock && 'cursor-pointer',
                    !selected && !isOutOfStock && 'hover:bg-muted/40',
                    selected && 'bg-emerald-500/40',
                    item.stockCount - qty < 0 &&
                      'bg-destructive/10 animate-pulse',
                    isOutOfStock && 'opacity-60',
                  )}
                >
                  {selected && (
                    <div className="top-1/2 right-2 absolute flex justify-center items-center bg-primary rounded-full w-5 h-5 font-semibold text-[10px] text-primary-foreground -translate-y-1/2">
                      {qty}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p
                      className={cn(
                        'font-medium text-sm',
                        isOutOfStock
                          ? 'text-muted-foreground/60 line-through'
                          : 'text-foreground',
                      )}
                    >
                      {item.name}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      {isOutOfStock
                        ? 'Out of stock'
                        : `${remainingStock} available`}
                    </p>
                  </div>

                  <div className="w-24 shrink-0" />
                </div>
              )
            })}
          </ScrollArea>

          <DrawerFooter className="pt-4">
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={handleAddItems}
                disabled={totalCount === 0 || isPending || hasStockConflict}
              >
                {isPending ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  `Confirm (${totalCount})`
                )}
              </Button>

              <DrawerClose asChild>
                <Button variant="ghost" size="sm" disabled={isPending}>
                  Cancel
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
