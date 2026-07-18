import { createFileRoute, redirect } from '@tanstack/react-router'
import { MenuManagement } from '@/components/restaurant_mobile/menuManagement'

const MAIN_CATEGORIES = [
  'appetizers',
  'main_courses',
  'bakery',
  'desserts',
  'beverages',
  'hard_drinks',
  'specials',
  'others',
] as const

type MainCategory = (typeof MAIN_CATEGORIES)[number]

export type Search = {
  category: MainCategory | ''
}

export const Route = createFileRoute('/home/menuManagement')({
  beforeLoad: ({ context: { auth, user } }) => {
    if (!auth.isAuthenticated || !user) {
      throw redirect({ to: '/' })
    }

    if (user.role !== 'manager' && user.role !== 'owner') {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
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
    return <MenuManagement />
  },
})
