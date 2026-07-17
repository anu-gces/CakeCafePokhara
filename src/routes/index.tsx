import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/landingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,

  beforeLoad: ({ context: { auth, user } }) => {
    console.log('auth', auth)
    console.log('user', user)

    if (auth.isLoading) return

    if (auth.isAuthenticated) {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
})
