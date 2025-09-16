import { InventoryManagement } from '@/components/restaurant_mobile/inventoryManagement'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/inventoryManagement')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: (search.category as string) || '',
    }
  },
})

function RouteComponent() {
  return <InventoryManagement />
}
