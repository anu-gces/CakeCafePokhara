import { Error404 } from '@/components/error404'
import { Home } from '@/components/home_mobile'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home')({
  component: Home,
  beforeLoad: ({ context: { auth, user } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
    if (user?.role === 'unverified') {
      throw redirect({ to: '/unverified' })
    }
  },
  notFoundComponent: Error404,
})
