import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/employee/$employeeId/sales')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/home/employee/$employeeId/sales"!</div>
}
