import { authenticatedQuery } from '../functions'
import { vv } from '../schema'

export const getDashboard = authenticatedQuery({
  args: {
    branchId: vv.id('branches'),
    startDate: vv.number(),
    endDate: vv.number(),
  },

  minimumRole: 'manager',

  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query('orderTickets')
      .withIndex('by_branch_status_and_date', (q) =>
        q
          .eq('branchId', args.branchId)
          .eq('status', 'paid')
          .gte('orderDate', args.startDate)
          .lte('orderDate', args.endDate),
      )
      .collect()

    return tickets
  },
})
