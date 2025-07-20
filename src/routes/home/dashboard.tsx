import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home/dashboard')({
  beforeLoad: ({ context: { authentication } }) => {
    // Wait for authentication to be ready if needed
    const userAdditional = authentication.userAdditional
    if (
      userAdditional &&
      userAdditional.role !== 'admin' &&
      userAdditional.role !== 'owner'
    ) {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
})
