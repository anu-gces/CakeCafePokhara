import { getAuthUserId } from '@convex-dev/auth/server'
import { query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { authenticatedMutation, authenticatedQuery } from './functions'
import schema from './schema'

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    return await ctx.db.get(userId)
  },
})

export const getUserById = authenticatedQuery({
  args: { id: v.string() },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    // Verify if the string is structurally a valid 'users' ID
    const validId = ctx.db.normalizeId('users', args.id)

    if (!validId) {
      return null
    }

    return await ctx.db.get(validId)
  },
})

const editUserField = schema.tables.users.validator.pick(
  'salary',
  'phone',
  'role',
)

export const editUserById = authenticatedMutation({
  args: {
    id: v.id('users'),
    ...editUserField.fields,
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const targetUser = await ctx.db.get(id)

    // Block only real role changes off 'owner' — allow unchanged/absent role
    // plus salary/phone edits to go through
    if (
      targetUser?.role === 'owner' &&
      updates.role &&
      updates.role !== 'owner'
    ) {
      throw new ConvexError("Unauthorized: Cannot change an owner's role.")
    }

    // Block assigning owner to anyone who isn't already one
    if (updates.role === 'owner' && targetUser?.role !== 'owner') {
      throw new ConvexError(
        "Unauthorized: Assigning the 'owner' role is restricted.",
      )
    }

    return await ctx.db.patch(id, updates)
  },
})

export const getAllUsers = authenticatedQuery({
  args: {},
  minimumRole: 'manager',
  handler: async (ctx) => {
    return await ctx.db.query('users').order('desc').collect()
  },
})
