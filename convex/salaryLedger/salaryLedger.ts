import { authenticatedQuery, authenticatedMutation } from '../functions'
import schema from '../schema'
import { vv } from '../schema'

export const listSalaryLedger = authenticatedQuery({
  args: {
    id: vv.id('users'),
  },
  minimumRole: 'employee',
  handler: async (ctx, { id }) => {
    const isManager = ctx.user.role === 'manager' || ctx.user.role === 'owner'

    // If manager/owner then use requested id. If employee, force query to use their own id.
    const targetUserId = isManager ? id : ctx.user._id

    return await ctx.db
      .query('salaryLedger')
      .withIndex('by_userId_and_date', (q) => q.eq('userId', targetUserId))
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
