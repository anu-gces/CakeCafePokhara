import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/home/employee/employeeDailyReport')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
