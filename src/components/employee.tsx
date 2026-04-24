import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowUpDown,
  DollarSignIcon,
  MoreHorizontal,
  PhoneIcon,
  User2Icon,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DocumentData } from 'firebase/firestore'

import { useNavigate } from '@tanstack/react-router'
import { pb } from '@/lib/pocketbase'

// type User = Pick<
//   PBUser,
//   | 'id'
//   | 'email'
//   | 'firstName'
//   | 'lastName'
//   | 'phoneNumber'
//   | 'department'
//   | 'salary'
//   | 'role'
// >

// const UserValidationSchema = Yup.object().shape({
//   uid: Yup.string().required('UID is required'),
//   email: Yup.string().email('Invalid email').required('Email is required'),
//   firstName: Yup.string().required('First name is required'),
//   lastName: Yup.string().required('Last name is required'),
//   phoneNumber: Yup.string()
//     .matches(/^[0-9]*$/, 'Phone number must be a number')
//     .required('Phone number is required'),

//   department: Yup.string()
//     .oneOf(
//       ['kitchen', 'waiter', 'operations', 'management'],
//       'Invalid department',
//     )
//     .required('Department is required'),
//   role: Yup.string()
//     .oneOf(
//       ['employee', 'admin', 'owner'],
//       "Role must be either 'employee', 'admin', or 'owner'",
//     )
//     .required('Role is required'),
//   salary: Yup.number()
//     .typeError('Salary must be a number')
//     .positive('Salary must be a positive number')
//     .integer('Salary must be an integer')
//     .nullable(),
// })

export const columns: ColumnDef<DocumentData, unknown>[] = [
  {
    id: 'photo',
    accessorKey: 'photo',
    header: 'Photo',
    cell: ({ row }) => {
      const record = row.original
      const photoUrl = record.avatar
        ? pb.files.getURL(record, record.avatar)
        : undefined

      return (
        <>
          <Avatar className="w-10 h-10 cursor-pointer">
            <AvatarImage alt="Profile Picture" src={photoUrl} />
            <AvatarFallback>
              <User2Icon />
            </AvatarFallback>
          </Avatar>
        </>
      )
    },
  },
  {
    id: 'id',
    accessorKey: 'id',
    header: 'ID',
    enableResizing: true,
  },
  {
    id: 'firstName',
    accessorKey: 'firstName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          First Name
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="pl-4">{row.original.firstName}</div>,
    meta: {
      label: 'First Name',
    },
    enableResizing: true,
  },
  {
    id: 'lastName',
    accessorKey: 'lastName',
    header: 'Last Name',
    enableResizing: true,
  },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    header: 'Phone Number',
    enableResizing: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    enableResizing: true,
  },
  {
    id: 'department',
    accessorKey: 'department',
    header: 'Department',
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
  },
  {
    id: 'isProfileComplete',
    accessorKey: 'isProfileComplete',
    header: 'Profile Complete',
    cell: ({ row }) => (row.original.isProfileComplete ? 'Yes' : 'No'),
  },
  {
    id: 'salary',
    accessorKey: 'salary',
    header: 'Salary',
    cell: ({ row }) => {
      const salary = row.original.salary
      return salary ? `Rs.${salary.toLocaleString()}` : 'Not Set'
    },
  },
  {
    id: 'actions',
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original

      const navigate = useNavigate()

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 w-8 h-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => window.open(`tel:${user.phoneNumber}`, '_self')}
              >
                <PhoneIcon />
                Call Phone Number
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate({
                    to: '/home/employee/$salaryLedger',
                    params: { salaryLedger: user.id },
                    viewTransition: { types: ['slide-left'] },
                  })
                }}
              >
                <DollarSignIcon />
                Salary Ledger
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate({
                    to: '/home/employee/employeeDailyReport/$employeeId',
                    params: { employeeId: user.id },
                    viewTransition: { types: ['slide-left'] },
                  })
                }}
              >
                <User2Icon />
                Daily Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]
