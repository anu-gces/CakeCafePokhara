import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen.ts'
import { pb } from './lib/pocketbase.ts'

const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    pb: pb,
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
  // useEffect(() => {
  //   const refresh = async () => {
  //     if (pb.authStore.isValid) {
  //       try {
  //         await pb.collection('users').authRefresh()
  //         console.log('token refreshed')
  //       } catch {
  //         console.log('token dead, clearing')
  //         pb.authStore.clear()
  //       }
  //     } else {
  //       console.log('no valid token on load')
  //     }
  //   }
  //   refresh()
  // }, [])
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ pb: pb }} />
    </QueryClientProvider>
  )
}
