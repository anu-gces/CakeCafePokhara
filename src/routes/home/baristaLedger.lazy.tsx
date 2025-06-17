import { DataTable } from '@/components/ui/dataTable'
import { createLazyFileRoute } from '@tanstack/react-router'
import SplashScreen from '@/components/splashscreen'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { db } from '@/firebase/firestore'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  LoaderIcon,
  MoreHorizontalIcon,
  SquarePenIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type BaristaLedgerEntry = {
  id: string
  traineeName: string
  month: string
  trainingFee: number
  paymentStatus: 'Paid' | 'Pending'
  paymentDate: string
  phoneNumber: string
  notes: string
  approvedBy: string
}

const columns: ColumnDef<BaristaLedgerEntry>[] = [
  {
    accessorKey: 'traineeName',
    header: 'Trainee',
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone Number',
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.phoneNumber}</span>
    ),
  },
  {
    accessorKey: 'month',
    header: 'Month',
  },
  {
    accessorKey: 'trainingFee',
    header: 'Training Fee',
    cell: ({ row }) => (
      <span className="font-semibold">Rs.{row.original.trainingFee}</span>
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Status',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Payment Date',
    cell: ({ row }) => row.original.paymentDate || '-',
  },

  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => row.original.notes || '-',
  },
  {
    accessorKey: 'approvedBy',
    header: 'Approved By',
  },

  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const [selectedRow, setSelectedRow] = useState<BaristaLedgerEntry | null>(
        null,
      )
      const [deleteRowOpen, setDeleteRowOpen] = useState(false)
      const [editDrawerOpen, setEditDrawerOpen] = useState(false)
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedRow(row.original)
                  setEditDrawerOpen(true)
                }}
              >
                <SquarePenIcon className="mr-2 w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-500"
                onSelect={() => {
                  setSelectedRow(row.original)
                  setDeleteRowOpen(true)
                }}
              >
                <Trash2Icon className="mr-2 w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedRow && (
            <EditEntryDrawer
              row={selectedRow}
              open={editDrawerOpen}
              setOpen={setEditDrawerOpen}
            />
          )}
          {selectedRow && (
            <DeleteEntryDrawer
              row={selectedRow}
              open={deleteRowOpen}
              setOpen={setDeleteRowOpen}
            />
          )}
        </>
      )
    },
  },
]

// const fakeData: BaristaLedgerEntry[] = [
//   {
//     id: '1',
//     traineeName: 'Aman Singh',
//     month: '2024-06',
//     trainingFee: 4000,
//     paymentStatus: 'Paid',
//     phoneNumber: '1234567890',
//     paymentDate: '2024-06-30',
//     notes: 'Completed all modules',
//     approvedBy: 'Manager Raj',
//   },

// ]

export const Route = createLazyFileRoute('/home/baristaLedger')({
  component: () => {
    const { data, isLoading, isError, error } = useQuery<BaristaLedgerEntry[]>({
      queryKey: ['baristaLedger'],
      queryFn: async () => {
        const snapshot = await getDocs(collection(db, 'baristaLedger'))
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<BaristaLedgerEntry, 'id'>),
        }))
      },
    })

    if (isLoading) {
      return <SplashScreen />
    }
    if (isError) {
      return (
        <div className="top-1/2 left-1/2 absolute text-red-500 -translate-x-1/2 -translate-y-1/2">
          Error:{' '}
          {error instanceof Error ? error.message : 'Failed to load data'}
        </div>
      )
    }

    // if (isLoading) {
    //   return <SplashScreen />
    // }
    // if (error) return <div>Error occurred</div>

    // Use the user data in your component
    return (
      <div className="px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-primary text-2xl text-left">
            Barista Training Ledger
          </h1>
          <AddNewEntryDrawer />
        </div>

        <DataTable
          columns={columns}
          data={data || []}
          filterColumnId="traineeName"
          visibleColumns={[
            'traineeName',
            'phoneNumber',
            'month',
            'trainingFee',
            'actions',
          ]}
        />
      </div>
    )
  },
})

const AddNewEntryDrawer = () => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { userAdditional } = useFirebaseAuth()

  const addEntryMutation = useMutation({
    mutationFn: async (newEntry: Omit<BaristaLedgerEntry, 'id'>) => {
      const docRef = await addDoc(collection(db, 'baristaLedger'), newEntry)
      return { id: docRef.id, ...newEntry }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baristaLedger'] })
      setOpen(false)
      toast.success('New entry added successfully!')
    },
  })

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        shouldScaleBackground={true}
        setBackgroundColorOnScale={true}
      >
        <DrawerTrigger asChild>
          <Button onClick={() => setOpen(true)}>Add New Entry</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add New Barista Entry</DrawerTitle>
            <DrawerDescription>
              Enter details for the new Barisa training entry below.
            </DrawerDescription>
          </DrawerHeader>
          <Formik
            initialValues={{
              traineeName: '',
              phoneNumber: '',
              month: '',
              trainingFee: 0,
              paymentStatus: 'Pending',
              paymentDate: '',
              notes: '',
              approvedBy: userAdditional?.firstName || 'unknown',
            }}
            validationSchema={Yup.object({
              traineeName: Yup.string().required('Required'),
              phoneNumber: Yup.string()
                .required('Required')
                .matches(/^[0-9]+$/, 'Only digits 0-9 are allowed')
                .length(10, 'Must be exactly 10 digits'),
              month: Yup.string().required('Required'),
              trainingFee: Yup.number().positive().required('Required'),
              paymentStatus: Yup.mixed<'Paid' | 'Pending'>()
                .oneOf(['Paid', 'Pending'], 'Select Paid or Pending')
                .required('Required'),
              paymentDate: Yup.string().when('paymentStatus', {
                is: (val: string) => val === 'Paid',
                then: (schema) =>
                  schema.required(
                    'Payment date is required when status is Paid',
                  ),
                otherwise: (schema) => schema.notRequired(),
              }),
              notes: Yup.string(),
            })}
            onSubmit={(values, { resetForm }) => {
              addEntryMutation.mutate({
                ...values,
                paymentStatus: values.paymentStatus as 'Paid' | 'Pending',
              })
              resetForm()
            }}
          >
            {({ setFieldValue, values }) => (
              <Form className="space-y-4 p-4">
                <ScrollArea className="gap-2 py-4 h-108">
                  <div className="space-y-4">
                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="traineeName">
                        Trainee Name
                      </Label>
                      <Field as={Input} id="traineeName" name="traineeName" />
                      <ErrorMessage
                        name="traineeName"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>

                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="phoneNumber">
                        Trainee Phone Number
                      </Label>
                      <Field as={Input} id="phoneNumber" name="phoneNumber" />
                      <ErrorMessage
                        name="phoneNumber"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>

                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="month">
                        Month
                      </Label>
                      <DatePickerWithPresets
                        selected={
                          values.month ? new Date(values.month) : undefined
                        }
                        onSelect={(date) =>
                          setFieldValue(
                            'month',
                            date ? date.toISOString().slice(0, 10) : '',
                          )
                        }
                      />
                      <ErrorMessage
                        name="month"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="trainingFee">
                        Training Fee
                      </Label>
                      <Field
                        as={Input}
                        id="trainingFee"
                        name="trainingFee"
                        type="number"
                      />
                      <ErrorMessage
                        name="trainingFee"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="paymentStatus">
                        Payment Status
                      </Label>
                      <Select
                        value={values.paymentStatus}
                        onValueChange={(val) =>
                          setFieldValue('paymentStatus', val)
                        }
                        name="paymentStatus"
                      >
                        <SelectTrigger id="paymentStatus" className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage
                        name="paymentStatus"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="paymentDate">
                        Payment Date
                      </Label>
                      <DatePickerWithPresets
                        selected={
                          values.paymentDate
                            ? new Date(values.paymentDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setFieldValue(
                            'paymentDate',
                            date ? date.toISOString().slice(0, 10) : '',
                          )
                        }
                      />
                      <ErrorMessage
                        name="paymentDate"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                    <div className="space-y-2 px-4">
                      <Label className="font-bold" htmlFor="notes">
                        Notes
                      </Label>
                      <Field as={Textarea} id="notes" name="notes" />
                      <ErrorMessage
                        name="notes"
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                  </div>
                </ScrollArea>

                <DrawerFooter>
                  <Button type="submit" disabled={addEntryMutation.isPending}>
                    {addEntryMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <LoaderIcon
                          className="w-4 h-4 animate-spin"
                          color="white"
                        />
                        Saving...
                      </span>
                    ) : (
                      <span>Save</span>
                    )}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </Form>
            )}
          </Formik>
        </DrawerContent>
      </Drawer>
    </>
  )
}

const EditEntryDrawer = ({
  row,
  open,
  setOpen,
}: {
  row: BaristaLedgerEntry
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const queryClient = useQueryClient()

  const updateEntryMutation = useMutation({
    mutationFn: async (updatedEntry: BaristaLedgerEntry) => {
      const docRef = doc(db, 'baristaLedger', updatedEntry.id)
      await updateDoc(docRef, updatedEntry)
      return updatedEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baristaLedger'] })
      setOpen(false)
      toast.success('Entry updated successfully')
    },
  })

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground
      setBackgroundColorOnScale
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Barista Entry</DrawerTitle>
          <DrawerDescription>Update the entry details below.</DrawerDescription>
        </DrawerHeader>
        <Formik
          initialValues={{
            traineeName: row.traineeName,
            phoneNumber: row.phoneNumber,
            month: row.month,
            trainingFee: row.trainingFee,
            paymentStatus: row.paymentStatus,
            paymentDate: row.paymentDate,
            notes: row.notes,
            approvedBy: row.approvedBy,
          }}
          validationSchema={Yup.object({
            traineeName: Yup.string().required('Required'),
            phoneNumber: Yup.string()
              .required('Required')
              .matches(/^[0-9]+$/, 'Only digits 0-9 are allowed')
              .length(10, 'Must be exactly 10 digits'),
            month: Yup.string().required('Required'),
            trainingFee: Yup.number().positive().required('Required'),
            paymentStatus: Yup.mixed<'Paid' | 'Pending'>()
              .oneOf(['Paid', 'Pending'], 'Select Paid or Pending')
              .required('Required'),
            paymentDate: Yup.string().when('paymentStatus', {
              is: (val: string) => val === 'Paid',
              then: (schema) =>
                schema.required('Payment date is required when status is Paid'),
              otherwise: (schema) => schema.notRequired(),
            }),
            notes: Yup.string(),
          })}
          onSubmit={(values) => {
            updateEntryMutation.mutate({ id: row.id, ...values })
          }}
        >
          {({ setFieldValue, values }) => (
            <Form className="space-y-4 p-4">
              <ScrollArea className="gap-2 py-4 h-108">
                <div className="space-y-4">
                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="traineeName">
                      Trainee Name
                    </Label>
                    <Field as={Input} id="traineeName" name="traineeName" />
                    <ErrorMessage
                      name="traineeName"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>

                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="phoneNumber">
                      Trainee Phone Number
                    </Label>
                    <Field as={Input} id="phoneNumber" name="phoneNumber" />
                    <ErrorMessage
                      name="phoneNumber"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>

                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="month">
                      Month
                    </Label>
                    <DatePickerWithPresets
                      selected={
                        values.month ? new Date(values.month) : undefined
                      }
                      onSelect={(date) =>
                        setFieldValue(
                          'month',
                          date ? date.toISOString().slice(0, 10) : '',
                        )
                      }
                    />
                    <ErrorMessage
                      name="month"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>

                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="trainingFee">
                      Training Fee
                    </Label>
                    <Field
                      as={Input}
                      id="trainingFee"
                      name="trainingFee"
                      type="number"
                    />
                    <ErrorMessage
                      name="trainingFee"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>

                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="paymentStatus">
                      Payment Status
                    </Label>
                    <Select
                      value={values.paymentStatus}
                      onValueChange={(val) =>
                        setFieldValue('paymentStatus', val)
                      }
                      name="paymentStatus"
                    >
                      <SelectTrigger id="paymentStatus" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage
                      name="paymentStatus"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>

                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="paymentDate">
                      Payment Date
                    </Label>
                    <DatePickerWithPresets
                      selected={
                        values.paymentDate
                          ? new Date(values.paymentDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        setFieldValue(
                          'paymentDate',
                          date ? date.toISOString().slice(0, 10) : '',
                        )
                      }
                    />
                    <ErrorMessage
                      name="paymentDate"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>

                  <div className="space-y-2 px-4">
                    <Label className="font-bold" htmlFor="notes">
                      Notes
                    </Label>
                    <Field as={Textarea} id="notes" name="notes" />
                    <ErrorMessage
                      name="notes"
                      component="div"
                      className="text-red-500 text-xs"
                    />
                  </div>
                </div>
              </ScrollArea>

              <DrawerFooter>
                <Button type="submit" disabled={updateEntryMutation.isPending}>
                  {updateEntryMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderIcon
                        className="w-4 h-4 animate-spin"
                        color="white"
                      />
                      Saving...
                    </span>
                  ) : (
                    'Update'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </Form>
          )}
        </Formik>
      </DrawerContent>
    </Drawer>
  )
}

const DeleteEntryDrawer = ({
  row,
  open,
  setOpen,
}: {
  row: BaristaLedgerEntry
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const queryClient = useQueryClient()
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, 'baristaLedger', id)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baristaLedger'] })
      setOpen(false)
      toast.success('Entry deleted successfully')
    },
  })

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground
      setBackgroundColorOnScale
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Barista Entry</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this entry?
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <p className="text-sm">
            This action cannot be undone. Please confirm that you want to delete
            the entry for <strong>{row.traineeName}</strong> for the month{' '}
            <strong>{row.month}</strong>.
          </p>
        </div>
        <DrawerFooter>
          <Button
            onClick={() => deleteEntryMutation.mutate(row.id)}
            disabled={deleteEntryMutation.isPending}
          >
            {deleteEntryMutation.isPending ? (
              <span className="flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" color="white" />
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
