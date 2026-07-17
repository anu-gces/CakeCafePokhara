import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { SplashScreen } from '@/components/splashscreen'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LoaderIcon,
  Settings2Icon,
  SquareArrowOutUpRightIcon,
} from 'lucide-react'
import type { Doc } from '../../../../convex/_generated/dataModel'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/home/employee/table')({
  component: RouteComponent,
})

function RouteComponent() {
  const users = useQuery(api.users.getAllUsers)

  if (users === undefined) {
    return <SplashScreen />
  }

  if (users === null) {
    return (
      <div className="flex justify-center items-center bg-background h-screen text-muted-foreground">
        Error occurred loading employees
      </div>
    )
  }

  return (
    <div className="bg-background mx-auto px-4 py-6 max-w-7xl text-foreground">
      <header className="mb-6">
        <h1 className="font-bold text-primary text-2xl tracking-tight">
          Employee Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage and view team members
        </p>
      </header>

      <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-3">
        {users.map((employee, index) => (
          <Card
            key={`${employee._id}-${index}`}
            className="flex flex-col justify-between bg-card border-border text-card-foreground"
          >
            <CardHeader className="flex flex-row items-start space-x-4 space-y-0 p-4">
              <Avatar className="border border-border w-12 h-12">
                <AvatarImage
                  src={employee.image}
                  alt={employee.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted font-medium text-muted-foreground">
                  {employee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-1">
                  <CardTitle className="text-base truncate">
                    {employee.name}
                  </CardTitle>

                  <div className="flex justify-center items-center gap-2">
                    <EditDrawer employee={employee} />
                    <Link
                      to="/home/employee/$salaryLedger"
                      params={{ salaryLedger: employee._id }}
                    >
                      <SquareArrowOutUpRightIcon className="w-4 h-4" />
                      <span className="sr-only">View profile</span>
                    </Link>
                  </div>
                </div>
                <CardDescription className="text-muted-foreground text-sm truncate">
                  {employee.phone || 'No phone number'}
                  <br />
                  Rs. {employee.salary || '0'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="flex justify-end items-end mt-2 px-4 pt-3 pb-4 border-t text-muted-foreground text-xs">
              <Badge variant="secondary" className="font-normal capitalize">
                {employee.role}
              </Badge>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="col-span-full py-12 border border-border border-dashed rounded-lg text-muted-foreground text-center">
            No employees found.
          </div>
        )}
      </div>
    </div>
  )
}

export function EditDrawer({ employee }: { employee: Doc<'users'> }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Doc<'users'>['role']>(employee.role)
  const [salary, setSalary] = useState(employee.salary?.toString() ?? '')
  const [phone, setPhone] = useState(employee.phone ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const editUser = useMutation(api.users.editUserById)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await editUser({
        id: employee._id,
        role,
        salary: salary ? Number(salary) : undefined,
        phone: phone || undefined,
      })
      toast.success('User updated')
      setOpen(false)
    } catch {
      toast.error('Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-transparent border-border h-8 text-foreground"
        >
          <Settings2Icon className="w-3.5 h-3.5" />
          Manage
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit User</DrawerTitle>
          <DrawerDescription>
            Update role, salary, or phone number.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Doc<'users'>['role'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem disabled value="owner">
                  Owner
                </SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salary">Salary</Label>
            <Input
              id="salary"
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
