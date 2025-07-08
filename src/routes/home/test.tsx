import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/test')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/home/test"!</div>
}
