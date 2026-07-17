import { authenticatedQuery, authenticatedMutation } from '../functions'
import schema from '../schema'
import { vv } from '../schema'

const DAY_IN_MS = 86_400_000

export const listSalaryLedger = authenticatedQuery({
  args: {
    id: vv.id('users'),
    date: vv.number(),
  },
  minimumRole: 'manager',
  handler: async (ctx, { id, date }) => {
    return await ctx.db
      .query('salaryLedger')
      .withIndex('by_userId_and_date', (q) =>
        q
          .eq('userId', id)
          .gte('paidAt', date)
          .lt('paidAt', date + DAY_IN_MS),
      )
      .order('desc')
      .collect()
  },
})

export const createSalaryLedger = authenticatedMutation({
  args: schema.tables.salaryLedger.validator.omit('paidBy'),
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    // Inject the current authenticated user's ID server-side
    return await ctx.db.insert('salaryLedger', {
      ...args,
      paidBy: ctx.user._id,
    })
  },
})

export const deleteSalaryLedger = authenticatedMutation({
  args: {
    id: vv.id('salaryLedger'),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id)
  },
})
