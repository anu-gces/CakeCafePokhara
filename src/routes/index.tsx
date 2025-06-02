import { LandingPage } from '@/components/landingPage'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,

  beforeLoad: async ({ context: { authentication } }) => {
    // Wait for the user to be loaded if needed
    if (!authentication.getCurrentUser()) {
      return null
    }

    const userAdditional = authentication.userAdditional

    if (userAdditional?.isProfileComplete) {
      throw redirect({
        to: '/home/editMenu',
        search: { category: 'appetizers' },
      })
    } else {
      throw redirect({
        to: '/profileComplete',
      })
    }
  },
})
