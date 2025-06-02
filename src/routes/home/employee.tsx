import { createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentUserDocumentDetails } from '@/firebase/firestore'

// const dummyUsers: any = [
// 	{
// 		uid: "1",
// 		email: "john.doe@example.com",
// 		photoURL: null,
// 		firstName: "John",
// 		lastName: "Doe",
// 		phoneNumber: "123-456-7890",
// 		department: "Sales",
// 		role: "admin",
// 		isProfileComplete: true,
// 	},

// ];

export const Route = createFileRoute('/home/employee')({
  beforeLoad: async () => {
    const user = await getCurrentUserDocumentDetails()

    // Check if the user's role is owner or admin
    if (user!.role !== 'owner' && user!.role !== 'admin') {
      // If the user is not an owner or admin, navigate to the home page
      throw redirect({
        to: '/home/editMenu',
        search: { category: 'appetizers' },
      })
    }
  },
})
