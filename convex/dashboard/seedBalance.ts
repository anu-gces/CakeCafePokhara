import { authenticatedMutation, authenticatedQuery } from '../functions'
import { vv } from '../schema'

export const getSeedBalance = authenticatedQuery({
  args: {
    branchId: vv.id('branches'),
  },

  minimumRole: 'manager',

  async handler(ctx, args) {
    return await ctx.db
      .query('seedBalance')
      .filter((q) => q.eq(q.field('branchId'), args.branchId))
      .first()
  },
})

export const setSeedBalance = authenticatedMutation({
  args: {
    branchId: vv.id('branches'),
    amount: vv.number(),
    date: vv.number(),
  },

  minimumRole: 'manager',

  async handler(ctx, args) {
    const existing = await ctx.db
      .query('seedBalance')
      .filter((q) => q.eq(q.field('branchId'), args.branchId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, args)
      return existing._id
    }

    return await ctx.db.insert('seedBalance', args)
  },
})

export const clearSeedBalance = authenticatedMutation({
  args: {
    branchId: vv.id('branches'),
  },

  minimumRole: 'manager',

  async handler(ctx, args) {
    const existing = await ctx.db
      .query('seedBalance')
      .filter((q) => q.eq(q.field('branchId'), args.branchId))
      .first()

    if (!existing) return

    await ctx.db.delete(existing._id)
  },
})
