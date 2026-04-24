import { Error404 } from '@/components/error404'
import { Home } from '@/components/home_mobile'
import { parsePbError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/home')({
  component: Home,
  beforeLoad: ({ context: { pb } }) => {
    const user = pb.authStore.record ?? null

    if (!pb.authStore.isValid || !user) {
      throw redirect({ to: '/' })
    }
  },
  notFoundComponent: Error404,
  errorComponent: ({ error }) => {
    const navigate = useNavigate()
    const message = parsePbError(error)
    return (
      <div className="flex flex-col justify-center items-center gap-4 min-h-screen">
        <h1 className="font-bold text-2xl">Something went wrong</h1>
        <p className="max-w-sm text-muted-foreground text-sm text-center">
          {message}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '..' })}>
            Go back
          </Button>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  },
})
