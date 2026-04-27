import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home/dashboard')({
  beforeLoad: ({ context: { auth } }) => {
    // Wait for authentication to be ready if needed
    const user = auth.user
    if (user && user.role !== 'manager' && user.role !== 'owner') {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
})
