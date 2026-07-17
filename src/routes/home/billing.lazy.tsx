import { createLazyFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { SearchIcon, ReceiptIcon, LoaderIcon } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ReceiptDrawer } from '@/components/restaurant_mobile/receiptDrawer'
import { Button } from '@/components/ui/button'
import { SplashScreen } from '@/components/splashscreen'
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'
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

export const Route = createLazyFileRoute('/home/billing')({
  component: BillingPage,
})

const statusVariant = {
  active: 'outline',
  paid: 'default',
  cancelled: 'destructive',
  payLater: 'secondary',
  refunded: 'destructive',
} as const

function ProcessedByLabel({ userId }: { userId: Id<'users'> }) {
  const user = useQuery(api.users.getUserById, { id: userId })
  return (
    <span className="text-muted-foreground text-xs">
      {user?.name || user?.email || 'System'}
    </span>
  )
}

function BillingPage() {
  const user = useQuery(api.users.currentUser)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [search, setSearch] = useState('')

  const startTimestamp = selectedDate
    ? selectedDate.setHours(0, 0, 0, 0)
    : Date.now()

  const branches = useQuery(api.restaurant.branches.listBranches) ?? []
  const tickets =
    useQuery(api.restaurant.billing.getAllBillingTickets, {
      startDate: startTimestamp,
    }) ?? []

  const filtered = tickets
    .filter((t) =>
      selectedBranch === 'all' ? true : t.branchId === selectedBranch,
    )
    .filter((t) =>
      selectedPaymentMethod === 'all'
        ? true
        : t.paymentMethod?.toLowerCase() === selectedPaymentMethod,
    )
    .filter((t) =>
      search ? t.kotNumber.toLowerCase().includes(search.toLowerCase()) : true,
    )

  const [selectedTicket, setSelectedTicket] = useState<
    (typeof tickets)[number] | null
  >(null)

  if (!user) {
    return <SplashScreen />
  }

  return (
    <div className="flex flex-col mx-auto w-full max-w-5xl h-full">
      {/* Sticky header */}
      <div className="top-0 z-10 sticky bg-transparent backdrop-blur-sm border-primary/10 dark:border-zinc-700 border-b">
        <div className="px-4 py-6">
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="font-bold text-primary text-2xl">Billing</h1>
            <DatePickerWithPresets
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>

          <div className="flex sm:flex-row flex-col gap-3">
            <Tabs
              value={selectedBranch}
              onValueChange={setSelectedBranch}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All Branches</TabsTrigger>
                {branches.map((branch) => (
                  <TabsTrigger key={branch._id} value={branch._id}>
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Tabs
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All Payments</TabsTrigger>
                <TabsTrigger value="esewa">eSewa</TabsTrigger>
                <TabsTrigger value="bank">Bank</TabsTrigger>
                <TabsTrigger value="cash">Cash</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1">
              <SearchIcon className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2" />
              <Input
                placeholder="Search by KOT number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="mb-4 text-muted-foreground text-sm">
          {filtered.length} tickets
        </div>

        <div className="flex flex-col gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-muted-foreground text-center">
              <ReceiptIcon className="opacity-50 mx-auto mb-4 w-12 h-12" />
              No tickets found.
            </div>
          ) : (
            filtered.map((ticket) => (
              <>
                <div className="flex justify-center items-center gap-2 w-full">
                  <Card
                    key={ticket._id}
                    className="w-full cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setReceiptOpen(true)
                    }}
                  >
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{ticket.kotNumber}</Badge>
                            {ticket.tableNumber != null && (
                              <span className="text-muted-foreground text-xs">
                                Table {ticket.tableNumber}
                              </span>
                            )}
                            <span className="text-muted-foreground text-xs">
                              {branches.find((b) => b._id === ticket.branchId)
                                ?.name || 'Unknown Branch'}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs capitalize">
                            {ticket.orderType}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={statusVariant[ticket.status]}>
                            {ticket.status}
                          </Badge>
                          <ProcessedByLabel userId={ticket.processedBy} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
                        <span>
                          Subtotal:{' '}
                          <span className="text-foreground">
                            Rs. {ticket.subTotal}
                          </span>
                        </span>
                        <span>
                          Discount:{' '}
                          <span className="text-foreground">
                            Rs. {ticket.totalDiscount}
                          </span>
                        </span>
                        <span>
                          Tax:{' '}
                          <span className="text-foreground">
                            Rs. {ticket.taxAmount}
                          </span>
                        </span>
                        {ticket.deliveryCharge != null && (
                          <span>
                            Delivery:{' '}
                            <span className="text-foreground">
                              Rs. {ticket.deliveryCharge}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-border border-t">
                        <span className="text-muted-foreground text-xs">
                          {ticket.payLaterCustomerId
                            ? 'Pay Later'
                            : 'Direct Payment'}
                        </span>
                        <span className="font-medium text-primary text-base">
                          Rs. {ticket.totalAmount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  {(user.role === 'manager' || user.role === 'owner') && (
                    <div className="flex flex-col gap-2">
                      <RefundOrderDrawer ticket={ticket} />
                      <DeleteOrderHistoryDrawer ticket={ticket} />
                    </div>
                  )}
                </div>
              </>
            ))
          )}
        </div>
      </ScrollArea>

      <ReceiptDrawer
        data={selectedTicket}
        receiptOpen={receiptOpen}
        setReceiptOpen={setReceiptOpen}
      />
    </div>
  )
}

type OrderTicketWithItems = Doc<'orderTickets'> & {
  items: Doc<'orderItems'>[]
}

function DeleteOrderHistoryDrawer({
  ticket,
}: {
  ticket: OrderTicketWithItems
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const deleteOrderHistory = useMutation(
    api.restaurant.billing.deleteBillingTicketCascade,
  )

  const handleDeleteOrderHistory = async () => {
    try {
      setIsPending(true)
      const response = await deleteOrderHistory({ ticketId: ticket._id })
      toast.success(
        `KOT ${ticket.kotNumber} and its ${response.deletedItemsCount} items have been completely permanently deleted.`,
      )
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
        <Button title="Cancel Order" disabled={isPending}>
          Delete
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Are you sure you want to delete the order of KOT: {ticket.kotNumber}
            ?
          </DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleDeleteOrderHistory} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
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

function RefundOrderDrawer({ ticket }: { ticket: OrderTicketWithItems }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const refundOrder = useMutation(api.restaurant.billing.markAsRefunded)

  const handleRefundOrder = async () => {
    try {
      setIsPending(true)

      await refundOrder({ ticketId: ticket._id })

      toast.success(`KOT ${ticket.kotNumber} has been refunded successfully.`)

      setIsOpen(false)
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : 'Failed to refund order',
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" title="Refund Order" disabled={isPending}>
          Refund
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Are you sure you want to refund KOT: {ticket.kotNumber}?
          </DrawerTitle>

          <DrawerDescription>
            This will mark the order as refunded and adjust the billing records.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleRefundOrder} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                  Refunding...
                </>
              ) : (
                'Confirm Refund'
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
