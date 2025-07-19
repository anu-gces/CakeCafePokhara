import { createFileRoute, redirect } from '@tanstack/react-router'
import { MenuManagement } from '@/components/restaurant_mobile/menuManagement'
import { categories } from '@/components/restaurant_mobile/menuManagement'

export type Search = {
  category: (typeof categories)[number]['id'] | ''
}

export const Route = createFileRoute('/home/menuManagement')({
  beforeLoad: ({ context: { authentication } }) => {
    const userAdditional = authentication.userAdditional
    if (
      !userAdditional ||
      (userAdditional.role !== 'admin' && userAdditional.role !== 'owner')
    ) {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
  validateSearch: (search: Record<string, unknown>): Search => {
    const validCategories = categories.map((cat) => cat.id)
    const category = search.category as string
    return {
      category: validCategories.includes(category) ? category : '',
    }
  },
  component: () => {
    return <MenuManagement />
  },
})
