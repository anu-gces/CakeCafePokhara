import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/home/employee/employeeDailyReport/$employeeId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <span>Under Construction</span>
}
