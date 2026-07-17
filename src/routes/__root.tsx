import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/contexts/themeProvider'
import { Toaster } from '@/components/ui/sonner'

import {
  AlertCircle,
  CheckCircle,
  Info,
  Loader,
  TriangleAlert,
} from 'lucide-react'
import { globalError404 } from '@/components/globalError404'
import { SplashScreen } from '@/components/splashscreen'
import type { useConvexAuth } from 'convex/react'
import type { Doc } from '../../convex/_generated/dataModel'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  auth: ReturnType<typeof useConvexAuth>
  user: Doc<'users'> | null | undefined
}>()({
  component: () => {
    return (
      <ThemeProvider defaultTheme="light" storageKey="cakecafe-ui-theme">
        <div>
          <Outlet />

          <Toaster
            closeButton
            icons={{
              success: <CheckCircle />,
              info: <Info />,
              warning: <AlertCircle />,
              error: <TriangleAlert />,
              loading: <Loader />,
            }}
            toastOptions={{
              classNames: {
                toast: '!bg-background',
                title: '!text-foreground',
                description: '!text-foreground',
              },
            }}
          />
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools
            buttonPosition="bottom-left"
            position="bottom"
            initialIsOpen={false}
          />
        </div>
      </ThemeProvider>
    )
  },
  notFoundComponent: globalError404,
  pendingComponent: SplashScreen,
})
