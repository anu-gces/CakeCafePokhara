import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import type { FirebaseAuthType } from '@/lib/useFirebaseAuth'
import { AuthProvider } from '@/components/contexts/authProvider'
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
import SplashScreen from '@/components/splashscreen'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  authentication: FirebaseAuthType
}>()({
  component: () => (
    <ThemeProvider defaultTheme="light" storageKey="cakecafe-ui-theme">
      <div>
        <AuthProvider>
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
        </AuthProvider>
      </div>
    </ThemeProvider>
  ),
  notFoundComponent: globalError404,
  pendingComponent: SplashScreen,
})
