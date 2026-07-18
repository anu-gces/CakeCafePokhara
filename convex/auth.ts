import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'
import type { Doc } from './_generated/dataModel'
import { ConvexError } from 'convex/values'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId
      }

      return await ctx.db.insert('users', {
        ...args.profile,
        role: 'unverified',
        department: 'kitchen',
        salary: 0,
      })
    },
  },
})

const ROLE_WEIGHTS = {
  owner: 0,
  manager: 1,
  employee: 2,
  unverified: 3,
} as const

type Role = keyof typeof ROLE_WEIGHTS

export async function ensureUserHasRole(user: Doc<'users'>, minimumRole: Role) {
  const userRole = user.role

  if (ROLE_WEIGHTS[userRole] > ROLE_WEIGHTS[minimumRole]) {
    throw new ConvexError(
      `Unauthorized: Requires at least a ${minimumRole} role.`,
    )
  }
}
