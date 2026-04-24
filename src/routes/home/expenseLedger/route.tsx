import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/home/expenseLedger')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
