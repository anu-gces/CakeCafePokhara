import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'

export const Route = createFileRoute('/home/expenseLedger')({
  component: RouteComponent,
  loader: async () => {
    const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL)
    const branches = await client.query(
      api.restaurant.branches.listBranches,
      {},
    )
    return { branches }
  },
})

function RouteComponent() {
  return <Outlet />
}
