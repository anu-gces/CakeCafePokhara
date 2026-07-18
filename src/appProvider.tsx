import './index.css'
import {
  createRouter,
  RouterProvider,
  useNavigate,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen.ts'
import { useConvexAuth, useQuery } from 'convex/react'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { api } from '../convex/_generated/api'
import { SplashScreen } from './components/splashscreen.tsx'
import { Button } from './components/ui/button.tsx'
import { ConvexError } from 'convex/values'

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
  defaultErrorComponent: ({ error }) => {
    const navigate = useNavigate()

    const displayMessage =
      error instanceof ConvexError ? (error.data as string) : error.message

    return (
      <div className="flex flex-col justify-center items-center gap-4 min-h-screen">
        <h1 className="font-bold text-2xl">Something went wrong</h1>
        <p className="max-w-sm text-muted-foreground text-sm text-center">
          {displayMessage}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '..' })}>
            Go back
          </Button>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  },
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
