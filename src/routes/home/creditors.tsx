import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/home/creditors')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
