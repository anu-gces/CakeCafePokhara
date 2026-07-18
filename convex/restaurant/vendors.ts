import { authenticatedQuery, authenticatedMutation } from '../functions'
import { v } from 'convex/values'

export const listVendors = authenticatedQuery({
  args: {},
  minimumRole: 'employee',
  handler: async (ctx) => {
    const items = await ctx.db.query('vendors').collect()
    return items
  },
})

export const AddNewVendor = authenticatedMutation({
  args: { name: v.string(), remarks: v.optional(v.string()) },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const items = await ctx.db.insert('vendors', {
      name: args.name,
      remarks: args.remarks,
    })
    return items
  },
})

export const UpdateVendor = authenticatedMutation({
  args: {
    id: v.id('vendors'),
    name: v.string(),
    remarks: v.optional(v.string()),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    await ctx.db.patch('vendors', args.id, {
      name: args.name,
      remarks: args.remarks,
    })
    return args.id
  },
})

export const DeleteVendor = authenticatedMutation({
  args: {
    id: v.id('vendors'),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    await ctx.db.delete('vendors', args.id)
    return args.id
  },
})
