import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen.ts'
import { pb } from './lib/pocketbase.ts'
import { useEffect, useState } from 'react'
import { getAuthState } from './lib/auth.ts'

const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
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

export function AppProvider() {
  const [auth, setAuth] = useState(getAuthState())

  useEffect(() => {
    // Listen for ANY change in PocketBase (login, logout, token refresh)
    return pb.authStore.onChange(() => {
      setAuth(getAuthState())
    })
  }, [])
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ auth: auth }} />
    </QueryClientProvider>
  )
}
