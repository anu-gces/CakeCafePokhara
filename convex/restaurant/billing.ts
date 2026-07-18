import { authenticatedMutation, authenticatedQuery } from '../functions'
import { ConvexError, v } from 'convex/values'

const DAY_IN_MS = 86400 * 1000

export const getAllBillingTickets = authenticatedQuery({
  args: {
    startDate: v.number(),
  },
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    const endDate = args.startDate + DAY_IN_MS

    const tickets = await ctx.db
      .query('orderTickets')
      .withIndex('by_orderSettledDate', (q) =>
        q
          .gte('orderSettledDate', args.startDate)
          .lt('orderSettledDate', endDate),
      )
      .collect()

    return Promise.all(
      tickets.map(async (ticket) => {
        const items = await ctx.db
          .query('orderItems')
          .withIndex('by_orderTicketId', (q) =>
            q.eq('orderTicketId', ticket._id),
          )
          .collect()

        return { ...ticket, items }
      }),
    )
  },
})

export const deleteBillingTicketCascade = authenticatedMutation({
  args: {
    ticketId: v.id('orderTickets'),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    // Verify the ticket actually exists first
    const ticket = await ctx.db.get(args.ticketId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const items = await ctx.db
      .query('orderItems')
      .withIndex('by_orderTicketId', (q) =>
        q.eq('orderTicketId', args.ticketId),
      )
      .collect()

    // Delete all matching items simultaneously
    await Promise.all(items.map((item) => ctx.db.delete(item._id)))

    // Delete the main ticket record last
    await ctx.db.delete(args.ticketId)

    return { success: true, deletedItemsCount: items.length }
  },
})

export const markAsRefunded = authenticatedMutation({
  args: {
    ticketId: v.id('orderTickets'),
  },
  minimumRole: 'manager',

  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId)

    if (!ticket) {
      throw new ConvexError('Order not found.')
    }

    if (ticket.status !== 'paid') {
      throw new ConvexError('Only paid orders can be refunded.')
    }

    await ctx.db.patch(ticketId, {
      status: 'refunded',
    })
  },
})
