import { createFileRoute, redirect } from '@tanstack/react-router'
import { MenuManagement } from '@/components/restaurant_mobile/menuManagement'
import {
  MAIN_CATEGORIES,
  type MainCategory,
} from '@/lib/pocketbase/menuManagement'

export type Search = {
  category: MainCategory | ''
}

export const Route = createFileRoute('/home/menuManagement')({
  beforeLoad: ({ context: { pb } }) => {
    const auth = pb.authStore

    const user = auth.record

    if (!auth.isValid || !user) {
      throw redirect({ to: '/' })
    }

    if (user.role !== 'admin' && user.role !== 'owner') {
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
