import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/home/dashboard')({
  beforeLoad: ({ context: { pb } }) => {
    // Wait for authentication to be ready if needed
    const user = pb.authStore.record
    if (user && user.role !== 'admin' && user.role !== 'owner') {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
})
