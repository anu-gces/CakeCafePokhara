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
  beforeLoad: ({ context: { authentication } }) => {
    const { userAdditional } = authentication

    // Check if the user's role is owner or admin
    if (userAdditional?.role !== 'owner' && userAdditional?.role !== 'admin') {
      // If the user is not an owner or admin, navigate to the home page
      throw redirect({
        to: '/home/editMenu',
        search: { category: 'appetizers' },
      })
    }
  },
})
