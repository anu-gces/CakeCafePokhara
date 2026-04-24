import { createFileRoute } from '@tanstack/react-router'
import { type Search } from '@/routes/home/menuManagement'
import { TakeOrder } from '@/components/restaurant_mobile/takeOrder'
import {
  MAIN_CATEGORIES,
  type MainCategory,
} from '@/lib/pocketbase/menuManagement'

export const Route = createFileRoute('/home/takeOrder')({
  validateSearch: (search: Record<string, unknown>): Search => {
    const categoryValue = search.category

    if (
      typeof categoryValue === 'string' &&
      MAIN_CATEGORIES.includes(categoryValue as MainCategory)
    ) {
      return {
        category: categoryValue as MainCategory,
      }
    }

    return { category: '' }
  },
  component: () => {
    return (
      <>
        <TakeOrder />
      </>
    )
  },
})
