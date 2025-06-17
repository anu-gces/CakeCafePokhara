import { columns } from '@/components/employee'
import { DataTable } from '@/components/ui/dataTable'
import { createLazyFileRoute } from '@tanstack/react-router'

import { getAllUsers } from '@/firebase/firestore'

import { useQuery } from '@tanstack/react-query'
import SplashScreen from '@/components/splashscreen'

export const Route = createLazyFileRoute('/home/employee/table')({
  component: () => {
    const {
      data: users,
      isLoading,
      error,
    } = useQuery({
      queryKey: ['usersManagement'],
      queryFn: getAllUsers,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY,
    })

    if (isLoading) {
      return <SplashScreen />
    }
    if (error) return <div>Error occurred</div>

    // Use the user data in your component
    return (
      <div className="px-4">
        <h1 className="font-bold text-primary text-2xl text-left">
          Employee Management
        </h1>
        <DataTable
          columns={columns}
          data={users || []}
          filterColumnId="firstName"
          visibleColumns={['photo', 'actions', 'firstName', 'phoneNumber']}
        />
      </div>
    )
  },
})
