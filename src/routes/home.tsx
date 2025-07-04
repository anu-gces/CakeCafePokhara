import { Error404 } from '@/components/error404'
import { Home } from '@/components/home_mobile'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home')({
  component: Home,
  beforeLoad: async ({ context: { authentication } }) => {
    const user = authentication.getCurrentUser()

    if (!user) {
      throw redirect({
        to: '/',
      })
    }

    // Check if the user's profile is complete using the async method
    const profileIsComplete = await authentication.isUserProfileComplete()

    if (!profileIsComplete) {
      throw redirect({
        to: '/profileComplete',
      })
    }
  },
  notFoundComponent: Error404,
  errorComponent: (error: any) => (
    <div className="top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2 transform">
      <h1 className="font-bold text-2xl">Error</h1>
      <p className="text-red-500">
        An error occurred while loading the home page.
      </p>
      <p className="text-red-500">{error.message}</p>
    </div>
  ),
})
