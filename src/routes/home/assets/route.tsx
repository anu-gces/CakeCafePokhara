import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/home/assets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
