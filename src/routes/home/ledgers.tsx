import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/ledgers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/home/ledgers"!</div>
}
