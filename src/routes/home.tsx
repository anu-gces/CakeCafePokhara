import { Error404 } from '@/components/error404'
import { Home } from '@/components/home_mobile'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home')({
  component: Home,
  beforeLoad: ({ context: { authentication } }) => {
    // Wait for authentication to be ready if needed
    const user = authentication.getCurrentUser()

    if (!user) {
      throw redirect({
        to: '/',
      })
    }
    const userAdditional = authentication.userAdditional

    if (!userAdditional?.isProfileComplete) {
      throw redirect({
        to: '/profileComplete',
      })
    }
  },
  notFoundComponent: Error404,
})
