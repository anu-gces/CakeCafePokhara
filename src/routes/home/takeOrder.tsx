import { createFileRoute } from '@tanstack/react-router'
import { categories } from '@/components/restaurant_mobile/menuManagement'
import { type Search } from '@/routes/home/menuManagement'
import { TakeOrder } from '@/components/restaurant_mobile/takeOrder'

export const Route = createFileRoute('/home/takeOrder')({
  validateSearch: (search: Record<string, unknown>): Search => {
    const validCategories = categories.map((cat) => cat.id)
    const category = search.category as string
    return {
      category: validCategories.includes(category) ? category : '',
    }
  },
  component: () => {
    return (
      <>
        <TakeOrder />
      </>
    )
  },
})
