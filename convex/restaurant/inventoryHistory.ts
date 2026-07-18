import { authenticatedQuery } from '../functions'
import { v } from 'convex/values'

export const listInventoryHistory = authenticatedQuery({
  args: {
    selectedDay: v.number(),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const endOfDay = args.selectedDay + 24 * 60 * 60 * 1000 - 1
    const items = await ctx.db
      .query('inventoryHistory')
      .filter((q) =>
        q.and(
          q.gte(q.field('_creationTime'), args.selectedDay),
          q.lte(q.field('_creationTime'), endOfDay),
        ),
      )
      .order('desc')
      .collect()
    return items
  },
})
