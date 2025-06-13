import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/home/employee')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
