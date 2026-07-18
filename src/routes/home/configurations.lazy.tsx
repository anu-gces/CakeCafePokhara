import { createLazyFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { SplashScreen } from '@/components/splashscreen'
import { PlusIcon, Trash2Icon, StoreIcon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'
import { ScrollArea } from '@/components/ui/scroll-area'

export const Route = createLazyFileRoute('/home/configurations')({
  component: Configurations,
})

export function Configurations() {
  const auth = useConvexAuth()
  const currentUser = useQuery(api.users.currentUser)

  // Branch queries and mutations
  const branches = useQuery(api.restaurant.branches.listBranches)
  const createBranch = useMutation(api.restaurant.branches.createBranch)

  // State for adding a new branch
  const [branchName, setBranchName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchName.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      await createBranch({ name: branchName.trim() })
      setBranchName('')
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (auth.isLoading || !auth.isAuthenticated || !currentUser) {
    return <SplashScreen />
  }

  return (
    <ScrollArea className="bg-background h-full overflow-y-auto">
      <div className="mx-auto px-4 py-6 pb-20 max-w-xl">
        <h1 className="mb-6 font-bold text-foreground text-2xl tracking-tight">
          Configuration
        </h1>

        <h2 className="mb-2 px-1 font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
          Locations
        </h2>

        {currentUser.role === 'owner' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Branch</CardTitle>
              <CardDescription>
                Register an active operating desk or café outlet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBranch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g., Downtown Outlet"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  variant="outline"
                  type="submit"
                  disabled={!branchName.trim() || isSubmitting}
                >
                  Add <PlusIcon className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Branch List Panel */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {!branches || branches.length === 0 ? (
              <div className="p-6 text-muted-foreground text-xs text-center">
                No registered branch locations found.
              </div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch._id}
                  className="flex justify-between items-center hover:bg-muted/30 p-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex justify-center items-center bg-secondary rounded-lg w-8 h-8 shrink-0">
                      <StoreIcon className="w-4 h-4 text-secondary-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <div className="font-medium text-foreground text-sm truncate">
                        {branch.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70 truncate tracking-tight">
                        ID: {branch._id}
                      </div>
                    </div>
                  </div>

                  {currentUser.role === 'owner' && (
                    <DeleteDrawer
                      branchId={branch._id}
                      branchName={branch.name}
                    />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

function DeleteDrawer({
  branchId,
  branchName,
}: {
  branchId: any
  branchName: string
}) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteBranch = useMutation(api.restaurant.branches.deleteBranch)

  const handleConfirmDelete = async () => {
    if (isDeleting) return

    try {
      setIsDeleting(true)
      await deleteBranch({ id: branchId })
      toast.success(`Successfully deleted ${branchName}`)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof ConvexError
          ? (error.data as string)
          : error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="icon">
          <Trash2Icon className="stroke-white w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>
              This action will permanently delete the active operating branch
              profile for{' '}
              <strong className="text-foreground">{branchName}</strong>. This
              cannot be undone.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="flex-col gap-2 pt-2">
            <Button
              onClick={handleConfirmDelete}
              className="w-full"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoaderIcon className="stroke-white w-4 h-4 animate-spin" />
              ) : (
                'Confirm Delete'
              )}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="w-full"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
