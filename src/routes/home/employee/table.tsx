import { createFileRoute, redirect } from '@tanstack/react-router'

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

export const Route = createFileRoute('/home/employee/table')({
  beforeLoad: ({ context: { auth, user } }) => {
    if (auth.isLoading || !user) return

    // Check if the user's role is owner or admin
    if (user.role !== 'owner' && user.role !== 'manager') {
      // If the user is not an owner or admin, navigate to the home page
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
})
