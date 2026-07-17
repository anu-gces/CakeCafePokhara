import { createFileRoute, redirect } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/home/dashboard')({
  beforeLoad: ({ context: { auth, user } }) => {
    // Wait for authentication to be ready if needed
    if (auth.isLoading) {
      return
    }

    if (user && user.role !== 'manager' && user.role !== 'owner') {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
  loader: async () => {
    const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL)
    const branches = await client.query(
      api.restaurant.branches.listBranches,
      {},
    )
    return { branches }
  },
})
