import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowUpDown,
  DollarSignIcon,
  MoreHorizontal,
  PhoneIcon,
  SquarePenIcon,
  Trash2Icon,
  User2Icon,
} from 'lucide-react'
import * as Yup from 'yup'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DocumentData } from 'firebase/firestore'
import { Form, Formik } from 'formik'
import React from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteUser, editUserDetails } from '@/firebase/firestore'
import { useNavigate } from '@tanstack/react-router'
import { ScrollArea } from './ui/scroll-area'

export type User = {
  uid: string
  email: string
  photoURL: string | null
  firstName: string
  lastName: string
  phoneNumber: string
  department: string
  role: string
  profilePicture?: string | null
  isProfileComplete: boolean
  salary: number
}

const UserValidationSchema = Yup.object().shape({
  uid: Yup.string().required('UID is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phoneNumber: Yup.string()
    .matches(/^[0-9]*$/, 'Phone number must be a number')
    .required('Phone number is required'),

  department: Yup.string()
    .oneOf(
      ['kitchen', 'waiter', 'operations', 'management'],
      'Invalid department',
    )
    .required('Department is required'),
  role: Yup.string()
    .oneOf(
      ['employee', 'admin', 'owner'],
      "Role must be either 'employee', 'admin', or 'owner'",
    )
    .required('Role is required'),
  salary: Yup.number()
    .typeError('Salary must be a number')
    .positive('Salary must be a positive number')
    .integer('Salary must be an integer')
    .nullable(),
})

export const columns: ColumnDef<DocumentData, unknown>[] = [
  {
    id: 'photo',
    accessorKey: 'photo',
    header: 'Photo',
    cell: ({ row }) => (
      <Avatar className="w-10 h-10 cursor-pointer">
        <AvatarImage
          alt="Profile Picture"
          src={row.original.profilePicture || row.original.photoURL}
        />
        <AvatarFallback>
          <User2Icon />
        </AvatarFallback>
      </Avatar>
    ),
  },
  {
    id: 'uid',
    accessorKey: 'uid',
    header: 'UID',
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
      const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
      const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = React.useState(false)
      const initialValues: Omit<User, 'isProfileComplete' | 'photoURL'> = {
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        department: user.department,
        salary: user.salary,
        role: user.role,
      }

      const queryClient = useQueryClient()
      const navigate = useNavigate()
      const editMutation = useMutation({
        mutationFn: editUserDetails, // Use your actual deleteUser function

        onError: (error: any) => {
          toast.error(`Error: ${error.message || 'Something went wrong'}`)
        },
        onSuccess: () => {
          toast.success('User Details Updated Successfully!')
          setIsDeleteDrawerOpen(false) // Close the drawer after success
          queryClient.invalidateQueries({ queryKey: ['usersManagement'] }) // Invalidate the users query to refresh the data
        },
      })
      const deleteMutation = useMutation({
        mutationFn: deleteUser, // Use your actual deleteUser function

        onError: (error: any) => {
          toast.error(`Error: ${error.message || 'Something went wrong'}`)
        },
        onSuccess: () => {
          toast.success('User deleted successfully!')
          setIsDeleteDrawerOpen(false) // Close the drawer after success
          queryClient.invalidateQueries({ queryKey: ['usersManagement'] }) // Invalidate the users query to refresh the data
        },
      })

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
                    params: { salaryLedger: user.uid },
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
                    params: { employeeId: user.uid },
                    viewTransition: { types: ['slide-left'] },
                  })
                }}
              >
                <User2Icon />
                Daily Report
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDrawerOpen(true)}>
                <SquarePenIcon />
                Edit User Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-primary focus:text-rose-400"
                onClick={() => {
                  setIsDeleteDrawerOpen(true)
                }}
              >
                <Trash2Icon />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Drawer
            shouldScaleBackground={true}
            setBackgroundColorOnScale={true}
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
          >
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Edit User Details</DrawerTitle>
                <DrawerDescription>
                  Make changes to Profile here.
                </DrawerDescription>
              </DrawerHeader>
              <Formik
                initialValues={initialValues}
                validationSchema={UserValidationSchema}
                onSubmit={(values, actions) => {
                  const { email, ...rest } = values // Omit email
                  editMutation.mutate(rest)
                  actions.setSubmitting(false)
                  setIsDrawerOpen(false)
                }}
              >
                {(formik) => (
                  <Form>
                    <ScrollArea className="max-h-84 overflow-y-auto">
                      <div className="gap-4 grid py-4">
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label htmlFor="uid" className="text-right">
                            UID
                          </Label>
                          <Input
                            id="uid"
                            type="text"
                            name="uid"
                            placeholder="UID"
                            className="col-span-3"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.uid}
                            disabled
                          />
                        </div>
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label className="text-right" htmlFor="email">
                            Email
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Input
                              id="email"
                              type="text"
                              name="email"
                              disabled
                              placeholder="Email"
                              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formik.touched.email && formik.errors.email ? 'border-red-500 mb-1' : ''}`}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.email}
                            />
                            {formik.touched.email && formik.errors.email ? (
                              <p className="text-red-500 text-xs italic">
                                {formik.errors.email}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label className="text-right" htmlFor="firstName">
                            First Name
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Input
                              id="firstName"
                              type="text"
                              name="firstName"
                              placeholder="First Name"
                              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formik.touched.firstName && formik.errors.firstName ? 'border-red-500 mb-1' : ''}`}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.firstName}
                            />
                            {formik.touched.firstName &&
                            formik.errors.firstName ? (
                              <p className="text-red-500 text-xs italic">
                                {formik.errors.firstName}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label className="text-right" htmlFor="lastName">
                            Last Name
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Input
                              id="lastName"
                              type="text"
                              name="lastName"
                              placeholder="Last Name"
                              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formik.touched.lastName && formik.errors.lastName ? 'border-red-500 mb-1' : ''}`}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.lastName}
                            />
                            {formik.touched.lastName &&
                            formik.errors.lastName ? (
                              <p className="text-red-500 text-xs italic">
                                {formik.errors.lastName}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label
                            className="text-right text-nowrap"
                            htmlFor="phoneNumber"
                          >
                            Phone Number
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Input
                              id="phoneNumber"
                              type="text"
                              name="phoneNumber"
                              placeholder="Phone Number"
                              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formik.touched.phoneNumber && formik.errors.phoneNumber ? 'border-red-500 mb-1' : ''}`}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.phoneNumber}
                            />
                            {formik.touched.phoneNumber &&
                            formik.errors.phoneNumber ? (
                              <p className="text-red-500 text-xs italic">
                                {formik.errors.phoneNumber}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label className="text-right" htmlFor="department">
                            Department
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Select
                              name="department"
                              value={formik.values.department}
                              onValueChange={(value) =>
                                formik.setFieldValue('department', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kitchen">Kitchen</SelectItem>
                                <SelectItem value="waiter">Waiter</SelectItem>
                                <SelectItem value="operations">
                                  Operations
                                </SelectItem>
                                <SelectItem value="management">
                                  Management
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {formik.touched.department &&
                            formik.errors.department ? (
                              <div className="text-red-500">
                                {formik.errors.department}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label className="text-right" htmlFor="role">
                            Role
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Select
                              name="role"
                              value={formik.values.role}
                              onValueChange={(value) => {
                                formik.setFieldValue('role', value)
                                formik.validateField('role')
                              }}
                            >
                              <SelectTrigger>
                                {formik.values.role || 'Select Role'}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="employee">
                                  Employee
                                </SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                            {formik.touched.role && formik.errors.role ? (
                              <p className="text-red-500 text-xs italic">
                                {formik.errors.role}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="items-center gap-4 grid grid-cols-4">
                          <Label
                            className="text-right text-nowrap"
                            htmlFor="salary"
                          >
                            Salary
                          </Label>
                          <div className="space-y-1 col-span-3">
                            <Input
                              id="salary"
                              type="text"
                              name="salary"
                              placeholder="Salary"
                              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formik.touched.salary && formik.errors.salary ? 'border-red-500 mb-1' : ''}`}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.salary}
                            />
                            {formik.touched.salary && formik.errors.salary ? (
                              <p className="text-red-500 text-xs italic">
                                {formik.errors.salary}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>

                    <DrawerFooter>
                      <Button type="submit">Submit</Button>
                      <DrawerClose asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          Cancel
                        </Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </Form>
                )}
              </Formik>
            </DrawerContent>
          </Drawer>
          <Drawer
            shouldScaleBackground={true}
            setBackgroundColorOnScale={true}
            open={isDeleteDrawerOpen}
            onOpenChange={setIsDeleteDrawerOpen}
          >
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Delete User</DrawerTitle>
                <DrawerDescription>
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button
                  onClick={() => {
                    deleteMutation.mutate(user.uid)
                  }}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDrawerOpen(false)}
                >
                  Cancel
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      )
    },
  },
]
