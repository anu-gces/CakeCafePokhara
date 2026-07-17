import {
  customMutation,
  customQuery,
  customCtx,
} from 'convex-helpers/server/customFunctions'
import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { ensureUserHasRole } from './auth'
import { ConvexError } from 'convex/values'
import { Triggers } from 'convex-helpers/server/triggers'
import { DataModel } from './_generated/dataModel'

type Role = 'owner' | 'manager' | 'employee' | 'unverified'

type PaymentMethod = 'cash' | 'esewa' | 'bank'

export const triggers = new Triggers<DataModel>()

// Wrap the mutation so ctx.db becomes trigger-aware.
const triggerMutation = customMutation(mutation, customCtx(triggers.wrapDB))

function paymentMethodDeltaCalculator(method: PaymentMethod, amount: number) {
  return {
    cash: method === 'cash' ? amount : 0,
    esewa: method === 'esewa' ? amount : 0,
    bank: method === 'bank' ? amount : 0,
  }
}

const NEPAL_OFFSET = 5.75 * 60 * 60 * 1000
function getNepalDay(timestamp: number) {
  const nepalTime = timestamp + NEPAL_OFFSET

  const date = new Date(nepalTime)

  date.setUTCHours(0, 0, 0, 0)

  return date.getTime() - NEPAL_OFFSET
}

triggers.register('orderTickets', async (ctx, change) => {
  const ticket = change.newDoc

  if (
    ticket &&
    ticket.status === 'paid' &&
    change.oldDoc?.status === 'active'
  ) {
    const dayStart = getNepalDay(ticket.orderDate)
    const paymentMethodDelta = paymentMethodDeltaCalculator(
      ticket.paymentMethod,
      ticket.totalAmount,
    )

    const existing = await ctx.db
      .query('dailyStats')
      .withIndex('by_branch_and_date', (q) =>
        q.eq('branchId', ticket.branchId).eq('date', dayStart),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        salesCount: existing.salesCount + 1,
        revenue: existing.revenue + ticket.totalAmount,
        paymentBreakdown: {
          cash: existing.paymentBreakdown.cash + paymentMethodDelta.cash,
          esewa: existing.paymentBreakdown.esewa + paymentMethodDelta.esewa,
          bank: existing.paymentBreakdown.bank + paymentMethodDelta.bank,
        },
      })
    } else {
      await ctx.db.insert('dailyStats', {
        branchId: ticket.branchId,
        date: dayStart,
        salesCount: 1,
        revenue: ticket.totalAmount,
        expenses: 0,
        paymentBreakdown: paymentMethodDelta,
      })
    }
  }
})

// Pay Later -> Paid
triggers.register('orderTickets', async (ctx, change) => {
  const ticket = change.newDoc

  if (
    ticket &&
    ticket.status === 'paid' &&
    change.oldDoc?.status === 'payLater'
  ) {
    if (!ticket.orderSettledDate) {
      throw new Error('Paid pay-later ticket is missing orderSettledDate')
    }

    const dayStart = getNepalDay(ticket.orderSettledDate)
    const paymentMethodDelta = paymentMethodDeltaCalculator(
      ticket.paymentMethod,
      ticket.totalAmount,
    )

    const existing = await ctx.db
      .query('dailyStats')
      .withIndex('by_branch_and_date', (q) =>
        q.eq('branchId', ticket.branchId).eq('date', dayStart),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        salesCount: existing.salesCount + 1,
        revenue: existing.revenue + ticket.totalAmount,
        paymentBreakdown: {
          cash: existing.paymentBreakdown.cash + paymentMethodDelta.cash,
          esewa: existing.paymentBreakdown.esewa + paymentMethodDelta.esewa,
          bank: existing.paymentBreakdown.bank + paymentMethodDelta.bank,
        },
      })
    } else {
      await ctx.db.insert('dailyStats', {
        branchId: ticket.branchId,
        date: dayStart,
        salesCount: 1,
        revenue: ticket.totalAmount,
        expenses: 0,
        paymentBreakdown: paymentMethodDelta,
      })
    }
  }
})

triggers.register('orderTickets', async (ctx, change) => {
  const ticket = change.newDoc

  if (
    ticket &&
    ticket.status === 'refunded' &&
    change.oldDoc?.status === 'paid'
  ) {
    const dayStart = getNepalDay(ticket.orderDate)

    const existing = await ctx.db
      .query('dailyStats')
      .withIndex('by_branch_and_date', (q) =>
        q.eq('branchId', ticket.branchId).eq('date', dayStart),
      )
      .unique()

    if (existing) {
      const delta = paymentMethodDeltaCalculator(
        ticket.paymentMethod,
        ticket.totalAmount,
      )
      await ctx.db.patch(existing._id, {
        salesCount: Math.max(0, existing.salesCount - 1),
        revenue: existing.revenue - ticket.totalAmount,
        paymentBreakdown: {
          cash: Math.max(0, existing.paymentBreakdown.cash - delta.cash),
          esewa: Math.max(0, existing.paymentBreakdown.esewa - delta.esewa),
          bank: Math.max(0, existing.paymentBreakdown.bank - delta.bank),
        },
      })
    }
  }
})

// Expense tracking: credited → paid OR created as paid
triggers.register('expenseLedger', async (ctx, change) => {
  const expense = change.newDoc

  // Track when status changes TO 'paid' (either new paid or credited→paid)
  if (
    expense &&
    expense.status === 'paid' &&
    change.oldDoc?.status !== 'paid' // Wasn't paid before
  ) {
    // Use settledDate if coming from credited, otherwise use date
    const trackingDate = expense.settledDate || expense.date

    const dayStart = getNepalDay(trackingDate)

    const existing = await ctx.db
      .query('dailyStats')
      .withIndex('by_branch_and_date', (q) =>
        q.eq('branchId', expense.branchId).eq('date', dayStart),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        expenses: existing.expenses + expense.price * expense.quantity,
      })
    } else {
      await ctx.db.insert('dailyStats', {
        branchId: expense.branchId,
        date: dayStart,
        salesCount: 0,
        revenue: 0,
        expenses: expense.price * expense.quantity,
        paymentBreakdown: {
          cash: 0,
          esewa: 0,
          bank: 0,
        },
      })
    }
  }
})

export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx, _args, opts: { minimumRole: Role }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError('Unauthorized: You must be logged in.')
    }

    const user = await ctx.db.get(userId)
    if (!user) {
      throw new ConvexError('Unauthorized: User profile not found.')
    }

    await ensureUserHasRole(user, opts.minimumRole)

    return { ctx: { user }, args: {} }
  },
})

export const authenticatedMutation = customMutation(triggerMutation, {
  args: {},
  input: async (ctx, _args, opts: { minimumRole: Role }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError('Unauthorized: You must be logged in.')
    }

    const user = await ctx.db.get(userId)
    if (!user) {
      throw new ConvexError('Unauthorized: User profile not found.')
    }

    await ensureUserHasRole(user, opts.minimumRole)

    return { ctx: { user }, args: {} }
  },
})
