import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/landingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,

  beforeLoad: ({ context: { authentication } }) => {
    // Wait for the user to be loaded if needed
    if (!authentication.getCurrentUser()) {
      return null
    }

    const userAdditional = authentication.userAdditional

    if (userAdditional?.isProfileComplete) {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    } else {
      throw redirect({
        to: '/profileComplete',
      })
    }
  },
})
