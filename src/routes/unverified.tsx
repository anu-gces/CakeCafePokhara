import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/unverified')({
  component: RouteComponent,
  beforeLoad: ({ context: { auth, user } }) => {
    if (auth.isLoading) return

    // If they aren't even authenticated, send them back to login
    if (!auth.isAuthenticated || !user) {
      throw redirect({ to: '/' })
    }

    // If they have any verified role, send them to the floor interface
    if (user.role && user.role !== 'unverified') {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }

    // Otherwise, let them land on this purgatory page
  },
})

function RouteComponent() {
  const user = useQuery(api.users.currentUser)
  const { signOut } = useAuthActions()

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center bg-background p-4 min-h-screen">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Skeleton className="w-1/2 h-6" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center bg-background p-4 min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-semibold text-xl">
            Approval Required
          </CardTitle>
          <CardDescription>
            Your account is currently unverified.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            An owner or manager needs to assign your role before you can log in
            to the POS system.
          </p>

          <div className="bg-muted p-3 border rounded-lg text-xs">
            <span className="block mb-1 font-semibold">
              Your logged-in email:
            </span>
            <span className="font-mono text-muted-foreground break-all">
              {user?.email}
            </span>
          </div>

          <p className="text-muted-foreground text-xs italic">
            Tell your manager to open their admin panel and approve this email
            address.
          </p>
        </CardContent>

        <CardFooter>
          <Button className="w-full" onClick={() => void signOut()}>
            Log Out / Switch Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
