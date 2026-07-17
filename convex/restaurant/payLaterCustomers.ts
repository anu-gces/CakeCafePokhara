import { authenticatedQuery, authenticatedMutation } from '../functions'
import { v } from 'convex/values'

export const listPayLaterCustomers = authenticatedQuery({
  args: {},
  minimumRole: 'employee',
  handler: async (ctx) => {
    const items = await ctx.db.query('payLaterCustomers').collect()
    return items
  },
})

export const AddNewPayLaterCustomer = authenticatedMutation({
  args: { name: v.string(), remarks: v.optional(v.string()) },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const items = await ctx.db.insert('payLaterCustomers', {
      name: args.name,
      remarks: args.remarks,
    })
    return items
  },
})

export const UpdatePayLaterCustomer = authenticatedMutation({
  args: {
    id: v.id('payLaterCustomers'),
    name: v.string(),
    remarks: v.optional(v.string()),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const items = await ctx.db.patch('payLaterCustomers', args.id, {
      name: args.name,
      remarks: args.remarks,
    })
    return args.id
  },
})

export const DeletePayLaterCustomer = authenticatedMutation({
  args: {
    id: v.id('payLaterCustomers'),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    await ctx.db.delete('payLaterCustomers', args.id)
    return args.id
  },
})
