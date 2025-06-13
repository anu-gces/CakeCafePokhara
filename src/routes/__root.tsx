import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import type { FirebaseAuthType } from '@/lib/useFirebaseAuth'
import { AuthProvider } from '@/components/contexts/authProvider'
import { ThemeProvider } from '@/components/contexts/themeProvider'
import { Toaster } from '@/components/ui/sonner'
import OneSignal from 'react-onesignal'

import {
  AlertCircle,
  CheckCircle,
  Info,
  Loader,
  TriangleAlert,
} from 'lucide-react'
import { globalError404 } from '@/components/globalError404'
import SplashScreen from '@/components/splashscreen'
import { useEffect } from 'react'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  authentication: FirebaseAuthType
}>()({
  component: () => {
    useEffect(() => {
      OneSignal.init({
        appId: '6dca1664-a16e-4eee-8aaf-e3718f3ff655',
        // You can add other initialization options here
        notifyButton: {
          enable: true,
          prenotify: true,
          showCredit: false,
          text: {
            'tip.state.unsubscribed': 'Subscribe to notifications',
            'tip.state.subscribed': 'You are subscribed to notifications',
            'tip.state.blocked': 'You have blocked notifications',
            'message.prenotify': 'Click to subscribe to notifications',
            'message.action.subscribed': 'Thank you for subscribing!',
            'message.action.resubscribed': 'Thank you for resubscribing!',
            'message.action.unsubscribed':
              'You have unsubscribed from notifications',
            'message.action.subscribing': 'Subscribing...',
            'dialog.blocked.message':
              'Please enable notifications in your browser settings.',
            'dialog.blocked.title': 'Notifications Blocked',
            'dialog.main.button.subscribe': 'Subscribe',
            'dialog.main.button.unsubscribe': 'Unsubscribe',
            'dialog.main.title': 'Notifications',
          },
        },
        // Uncomment the below line to run on localhost. See: https://documentation.onesignal.com/docs/local-testing
        allowLocalhostAsSecureOrigin: true,
      })
    }, [])
    return (
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
    )
  },
  notFoundComponent: globalError404,
  pendingComponent: SplashScreen,
})
