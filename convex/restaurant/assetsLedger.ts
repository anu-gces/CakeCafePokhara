import { authenticatedQuery, authenticatedMutation } from '../functions'
import schema from '../schema'
import { vv } from '../schema'

export const listassetsLedger = authenticatedQuery({
  args: {
    department: schema.tables.assetsLedger.validator.fields.department,
  },
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    const assetsLedger = await ctx.db
      .query('assetsLedger')
      .filter((q) => q.eq('department', args.department))
      .collect()

    return await Promise.all(
      assetsLedger.map(async (asset) => {
        const createdBy = await ctx.db.get(asset.createdBy)

        return {
          ...asset,
          createdBy,
        }
      }),
    )
  },
})

export const createAsset = authenticatedMutation({
  args: schema.tables.assetsLedger.validator.omit('createdBy'),
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    return await ctx.db.insert('assetsLedger', {
      ...args,
      createdBy: ctx.user._id,
    })
  },
})

export const deleteAsset = authenticatedMutation({
  args: {
    id: vv.id('assetsLedger'),
  },
  minimumRole: 'manager',
  handler: async (ctx, { id }) => {
    return await ctx.db.delete(id)
  },
})
