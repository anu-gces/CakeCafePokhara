import { InventoryHistory } from '@/components/restaurant_mobile/inventoryHistory'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/inventoryHistory')({
  component: RouteComponent,
})

function RouteComponent() {
  return <InventoryHistory />
}
