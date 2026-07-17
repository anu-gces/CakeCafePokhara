import { authenticatedQuery, authenticatedMutation } from '../functions'
import { vv } from '../schema'

export const getPayLaterCustomerById = authenticatedQuery({
  args: {
    payLaterCustomerId: vv.id('payLaterCustomers'),
  },
  minimumRole: 'employee',
  handler: async (ctx, { payLaterCustomerId }) => {
    const customer = await ctx.db.get(payLaterCustomerId)

    if (!customer) {
      return null
    }

    return customer
  },
})

export const listByPayLaterCustomerId = authenticatedQuery({
  args: {
    payLaterCustomerId: vv.id('payLaterCustomers'),
  },
  minimumRole: 'employee',
  handler: async (ctx, { payLaterCustomerId }) => {
    const ledgers = await ctx.db
      .query('orderTickets')
      .withIndex('by_payLaterCustomerId', (q) =>
        q.eq('payLaterCustomerId', payLaterCustomerId),
      )
      .collect()

    const payLaterTickets = ledgers.filter(
      (ticket) => ticket.status === 'payLater',
    )

    return await Promise.all(
      payLaterTickets.map(async (ticket) => {
        const processedByUser = await ctx.db.get(ticket.processedBy)
        return {
          ...ticket,
          processedByUser,
        }
      }),
    )
  },
})

export const markAsPaid = authenticatedMutation({
  args: {
    id: vv.id('orderTickets'),
  },
  minimumRole: 'employee',
  handler: async (ctx, { id }) => {
    const expense = await ctx.db.get(id)

    if (!expense) {
      throw new Error('Expense not found')
    }

    if (expense.status !== 'paid') {
      await ctx.db.patch(id, {
        status: 'paid',
        orderSettledDate: Date.now(),
      })
    }
  },
})
