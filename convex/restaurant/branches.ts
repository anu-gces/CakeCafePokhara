import { query } from '../_generated/server'
import { authenticatedMutation } from '../functions'
import { ConvexError, v } from 'convex/values'

/**
 * Fetch all available branches.
 * Accessible by any verified employee.
 */
export const listBranches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('branches').collect()
  },
})

/**
 * Register a brand new branch location.
 * Locked down strictly to the 'owner' role.
 */
export const createBranch = authenticatedMutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
  },
  minimumRole: 'owner',
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim()
    if (!trimmedName) {
      throw new ConvexError('Branch name cannot be empty')
    }

    const branchId = await ctx.db.insert('branches', {
      name: trimmedName,
      address: args.address,
    })

    return branchId
  },
})

/**
 * Delete an existing branch location.
 * Locked down strictly to the 'owner' role.
 */
export const deleteBranch = authenticatedMutation({
  args: {
    id: v.id('branches'),
  },
  minimumRole: 'owner',
  handler: async (ctx, args) => {
    const { id } = args

    // Safety check: verify the branch exists before deleting
    const branch = await ctx.db.get(id)
    if (!branch) {
      throw new ConvexError('Branch not found')
    }

    await ctx.db.delete(id)
  },
})
