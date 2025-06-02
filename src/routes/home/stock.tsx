import { createFileRoute } from '@tanstack/react-router'
import type { kanbanCategory } from '@/components/stock'

export const Route = createFileRoute('/home/stock')({
  validateSearch: (searchParams) => ({
    category: (searchParams.category as kanbanCategory) || 'Kitchen', // Default to "Kitchen" if no category is provided
  }),
})
