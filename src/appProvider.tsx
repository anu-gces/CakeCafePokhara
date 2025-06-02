import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen.ts'
import { ThemeProvider } from './lib/themeProvider.tsx'
import { useFirebaseAuth } from './lib/useFirebaseAuth.ts'
import SplashScreen from './components/splashscreen.tsx'

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    authentication: undefined!,
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  defaultViewTransition: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppProvider() {
  const authentication = useFirebaseAuth()

  if (authentication.loading) {
    return <SplashScreen />
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cakecafe-ui-theme">
        <RouterProvider router={router} context={{ authentication }} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
