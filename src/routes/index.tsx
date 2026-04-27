import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/landingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,

  beforeLoad: ({ context: { auth } }) => {
    if (auth.isAuthenticated) {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
})
