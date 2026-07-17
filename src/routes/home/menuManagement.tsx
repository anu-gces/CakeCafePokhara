import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { MenuManagement } from '@/components/restaurant_mobile/menuManagement'
import { Button } from '@/components/ui/button'

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
  errorComponent: ({ error }) => {
    const navigate = useNavigate()
    return (
      <div className="flex flex-col justify-center items-center gap-4 min-h-screen">
        <h1 className="font-bold text-2xl">Something went wrong</h1>
        <p className="max-w-sm text-muted-foreground text-sm text-center">
          {error.message}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '..' })}>
            Go back
          </Button>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  },
})
