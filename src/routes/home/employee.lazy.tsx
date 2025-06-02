import { columns } from "@/components/employee";
import { DataTable } from "@/components/ui/dataTable";
import { createLazyFileRoute } from "@tanstack/react-router";

import { getAllUsers } from "@/firebase/firestore";

import { useLoadingSpinner } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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

export const Route = createLazyFileRoute("/home/employee")({
  component: () => {
    const {
      data: users,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["usersManagement"],
      queryFn: getAllUsers,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY,
    });

    useLoadingSpinner(isLoading);
    if (error) return <div>Error occurred</div>;

    // Use the user data in your component
    return (
      <>
        <DataTable
          columns={columns}
          data={users || []}
          filterColumnId="firstName"
          visibleColumns={["photo", "actions", "firstName", "phoneNumber"]}
        />
      </>
    );
  },
});
