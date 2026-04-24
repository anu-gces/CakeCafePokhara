import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/landingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,

  beforeLoad: ({ context: { pb } }) => {
    // Wait for the user to be loaded if needed
    if (!pb.authStore.isValid) {
      return null
    }

    throw redirect({
      to: '/home/takeOrder',
      search: { category: 'appetizers' },
    })
  },
})
