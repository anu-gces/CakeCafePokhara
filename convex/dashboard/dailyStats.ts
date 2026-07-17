import { authenticatedQuery } from '../functions'
import { vv } from '../schema'

export const getDashboard = authenticatedQuery({
  args: {
    branchId: vv.id('branches'),
  },

  minimumRole: 'manager',

  handler: async (ctx, args) => {
    const dailyStats = await ctx.db
      .query('dailyStats')
      .withIndex('by_branch_and_date', (q) => q.eq('branchId', args.branchId))
      .collect()

    return dailyStats
  },
})
