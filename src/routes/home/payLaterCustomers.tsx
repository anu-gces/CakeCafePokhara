import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/home/payLaterCustomers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
