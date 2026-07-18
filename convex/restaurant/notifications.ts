import { ConvexError } from 'convex/values'
import { query } from '../_generated/server'
import { vv } from '../schema'
import { authenticatedMutation } from '../functions'

export const getActiveNotificationFeed = query({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch all active order tickets across every branch
    const activeTickets = await ctx.db
      .query('orderTickets')
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect()

    if (activeTickets.length === 0) {
      return []
    }

    // 2. Extract the ticket IDs to batch-fetch items
    const ticketIds = activeTickets.map((ticket) => ticket._id)

    // 3. Fetch all items matching these tickets in a single pass
    // (Ensure you have an index on orderTicketId for ideal performance)
    const allItems = await ctx.db
      .query('orderItems')
      .filter((q) =>
        q.or(...ticketIds.map((id) => q.eq(q.field('orderTicketId'), id))),
      )
      .collect()

    // 4. Map the items back into their respective tickets
    const nestedFeed = activeTickets.map((ticket) => {
      const ticketItems = allItems.filter(
        (item) => item.orderTicketId === ticket._id,
      )

      return {
        ...ticket,
        items: ticketItems,
      }
    })

    // Return the sorted feed (newest orders first)
    return nestedFeed.sort((a, b) => b.orderDate - a.orderDate)
  },
})

export const getActiveNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const activeTickets = await ctx.db
      .query('orderTickets')
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect()

    return activeTickets.length
  },
})

export const markCooked = authenticatedMutation({
  args: { orderId: vv.id('orderItems') },
  minimumRole: 'employee',
  handler: async (ctx, { orderId }) => {
    // 1. Check Department of Employee. Owner and Manager get pass.
    if (ctx.user.role === 'employee' && ctx.user.department !== 'kitchen') {
      throw new ConvexError(
        'Unauthorized: Only chefs can mark items as cooked.',
      )
    }

    // 2. State validation
    const order = await ctx.db.get(orderId)
    if (!order || order.itemStatus !== 'cooking') {
      throw new ConvexError(
        "Order must be in 'cooking' state to mark as cooked",
      )
    }

    // 3. Execution
    await ctx.db.patch(orderId, { itemStatus: 'cooked' })
  },
})

export const markServed = authenticatedMutation({
  args: { orderId: vv.id('orderItems') },
  minimumRole: 'employee',
  handler: async (ctx, { orderId }) => {
    // 1. Check Department of Employee
    if (ctx.user.role === 'employee' && ctx.user.department !== 'waiter') {
      throw new ConvexError(
        'Unauthorized: Only service staff can mark items as served.',
      )
    }

    // 2. State validation
    const order = await ctx.db.get(orderId)
    if (!order || order.itemStatus !== 'cooked') {
      throw new ConvexError("Order must be in 'cooked' state to mark as served")
    }

    // 3. Execution
    await ctx.db.patch(orderId, { itemStatus: 'served' })
  },
})

export const markCancelled = authenticatedMutation({
  args: { orderId: vv.id('orderItems') },
  minimumRole: 'employee',
  handler: async (ctx, { orderId }) => {
    // 1. Check Department of Employee
    if (
      ctx.user.role === 'employee' &&
      ctx.user.department !== 'waiter' &&
      ctx.user.department !== 'reception'
    ) {
      throw new ConvexError(
        'Unauthorized: Only service staff can mark items as cancelled.',
      )
    }

    const order = await ctx.db.get(orderId)
    if (!order) {
      throw new ConvexError('Order not found')
    }

    // 2. Allow cancellation from either 'cooking' or 'cooked'
    const canCancel =
      order.itemStatus === 'cooking' || order.itemStatus === 'cooked'
    if (!canCancel) {
      throw new ConvexError(
        "Order must be in 'cooking' or 'cooked' state to mark as cancelled",
      )
    }

    // 3. Done
    await ctx.db.patch(orderId, { itemStatus: 'cancelled' })
  },
})

// =================================================================
//        TICKET STATUS TRANSITIONS
// =================================================================

/**
 * Transition: ACTIVE ➔ PAID
 * Rules:
 * 1. Ticket must be currently 'active'.
 * 2. All associated order items MUST have an itemStatus of 'served' or 'cancelled'.
 * 3. Enforces that tickets intended for 'paylater' accounts cannot use this general path.
 */
export const markTicketAsPaid = authenticatedMutation({
  args: { ticketId: vv.id('orderTickets') },
  minimumRole: 'employee',
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId)
    if (!ticket) {
      throw new ConvexError('Ticket not found')
    }

    // 1. Ensure current state is active
    if (ticket.status !== 'active') {
      throw new ConvexError(
        `Ticket must be 'active' to mark as paid. Current status: ${ticket.status}`,
      )
    }

    // 2. Deny regular payment if a pay-later customer ID is attached
    if (ticket.payLaterCustomerId) {
      throw new ConvexError(
        'This ticket has an associated Pay Later Account. Use markTicketAsPayLater instead.',
      )
    }

    // 3. Fetch all inner items to verify workflow fulfillment
    const items = await ctx.db
      .query('orderItems')
      .filter((q) => q.eq(q.field('orderTicketId'), ticketId))
      .collect()

    const allServedOrCancelled = items.every(
      (item) => item.itemStatus === 'served' || item.itemStatus === 'cancelled',
    )

    if (!allServedOrCancelled) {
      throw new ConvexError(
        'Cannot settle payment: Some active items are still cooking or cooked and not yet served.',
      )
    }

    // 4. Update ticket status atomically
    await ctx.db.patch(ticketId, {
      status: 'paid',
      orderSettledDate: Date.now(),
      processedBy: ctx.user._id,
    })
  },
})

// =================================================================

/**
 * Transition: ACTIVE ➔ PAY LATER
 * Rules:
 * 1. Ticket must be currently 'active'.
 * 2. All associated order items MUST be 'served' or 'cancelled'.
 * 3. Requires a valid payLaterCustomerId profile attached to the ticket structure.
 */
export const markTicketAsPayLater = authenticatedMutation({
  args: { ticketId: vv.id('orderTickets') },
  minimumRole: 'employee',
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId)
    if (!ticket) {
      throw new ConvexError('Ticket not found')
    }

    // 1. Ensure current state is active
    if (ticket.status !== 'active') {
      throw new ConvexError(
        `Ticket must be 'active' to defer payment. Current status: ${ticket.status}`,
      )
    }

    // 2. Enforce presence of target credit profile reference
    if (!ticket.payLaterCustomerId) {
      throw new ConvexError(
        'Missing account profile: Cannot defer payment without an assigned Pay Later Customer ID.',
      )
    }

    // 3. Verify all inner items are served or cancelled
    const items = await ctx.db
      .query('orderItems')
      .filter((q) => q.eq(q.field('orderTicketId'), ticketId))
      .collect()

    const allServedOrCancelled = items.every(
      (item) => item.itemStatus === 'served' || item.itemStatus === 'cancelled',
    )

    if (!allServedOrCancelled) {
      throw new ConvexError(
        'Cannot process deferred payment: Ensure all active kitchen items are served.',
      )
    }

    // 4. Complete atomic adjustment
    await ctx.db.patch(ticketId, { status: 'payLater' })
  },
})

/**
 * Transition: ACTIVE ➔ CANCELLED
 * Rules:
 * 1. Ticket must be currently 'active'.
 * 2. Automatically cascades the 'cancelled' state down to all associated
 * inner order items that are not already 'served'.
 */
export const cancelWholeTicket = authenticatedMutation({
  args: { ticketId: vv.id('orderTickets') },
  minimumRole: 'employee',
  handler: async (ctx, { ticketId }) => {
    // 1. Authorization check: Only service/reception staff can kill whole tickets
    if (
      ctx.user.role === 'employee' &&
      ctx.user.department !== 'waiter' &&
      ctx.user.department !== 'reception'
    ) {
      throw new ConvexError(
        'Unauthorized: Only service or reception staff can cancel tickets.',
      )
    }

    const ticket = await ctx.db.get(ticketId)
    if (!ticket) {
      throw new ConvexError('Ticket not found')
    }

    // 2. Ensure the ticket is in a state that can actually be cancelled
    if (ticket.status !== 'active') {
      throw new ConvexError(
        `Only active tickets can be cancelled. Current status: ${ticket.status}`,
      )
    }

    // 3. Fetch all inner items to cascade cancellation where applicable
    const items = await ctx.db
      .query('orderItems')
      .filter((q) => q.eq(q.field('orderTicketId'), ticketId))
      .collect()

    // 4. Update unserved items to 'cancelled' so the kitchen knows to stop working
    for (const item of items) {
      if (item.itemStatus !== 'served' && item.itemStatus !== 'cancelled') {
        await ctx.db.patch(item._id, { itemStatus: 'cancelled' })
      }
    }

    // 5. Update parent ticket status atomically
    await ctx.db.patch(ticketId, { status: 'cancelled' })
  },
})
