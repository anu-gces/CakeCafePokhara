import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen.ts'
import { useConvexAuth, useQuery } from 'convex/react'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { api } from '../convex/_generated/api'
import { SplashScreen } from './components/splashscreen.tsx'

const queryClient = new QueryClient()
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
    user: undefined!,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultViewTransition: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useConvexAuth()
  const user = useQuery(api.users.currentUser)
  if (auth.isLoading || user === undefined) {
    return <SplashScreen />
  }
  return <RouterProvider router={router} context={{ auth, user }} />
}

export function AppProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConvexAuthProvider client={convex}>
        <InnerApp />
      </ConvexAuthProvider>
    </QueryClientProvider>
  )
}
