import { createFileRoute } from '@tanstack/react-router'

import { redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/profileComplete')({
  beforeLoad: async ({ context: { authentication } }) => {
    const user = await authentication.getCurrentUser()

    if (!user) {
      // If no user is authenticated, navigate to the login page
      throw redirect({
        to: '/',
      })
    }

    // Check if the user's profile is complete
    const profileIsComplete = await authentication.isUserProfileComplete()

    if (profileIsComplete) {
      // If the profile is complete, navigate to the home page
      throw redirect({
        to: '/home/editMenu',
        search: { category: 'appetizers' },
      })
    }
  },
})
