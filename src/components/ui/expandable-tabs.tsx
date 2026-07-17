import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { useQuery } from 'convex/react'

interface Tab {
  title: string
  icon: LucideIcon
  to: string
  type?: never
}

interface Separator {
  type: 'separator'
  title?: never
  icon?: never
}

export type TabItem = Tab | Separator

interface ExpandableTabsProps {
  tabs: TabItem[]
  className?: string
  activeColor?: string
  onChange?: (index: number | null) => void
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '.5rem',
    paddingRight: '.5rem',
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '.5rem' : 0,
    paddingLeft: isSelected ? '1rem' : '.5rem',
    paddingRight: isSelected ? '1rem' : '.5rem',
  }),
}

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
}

const transition = {
  delay: 0.1,
  type: 'spring',
  bounce: 0,
  duration: 0.6,
} as const

export function ExpandableTabs({
  tabs,
  className,
  activeColor = 'text-primary',
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const navigate = useNavigate()
  const currentLocation = useLocation()
  const notificationCount = useQuery(
    api.restaurant.notifications.getActiveNotificationCount,
  )

  const handleSelect = (index: number) => {
    setSelected(index)
    onChange?.(index)
  }

  // Synchronize route pathways with active tabs UI
  useEffect(() => {
    const currentPath = currentLocation.pathname

    const selectedIndex = tabs.findIndex((tab) => {
      if ('to' in tab && typeof tab.to === 'string') {
        const tabPath = new URL(tab.to, window.location.origin).pathname
        return tabPath === currentPath
      }
      return false
    })

    if (selectedIndex !== -1) {
      setSelected(selectedIndex)
    }
  }, [tabs, currentLocation])

  const SeparatorComponent = () => (
    <div className="mx-1 bg-border w-[1.2px] h-[24px]" aria-hidden="true" />
  )

  return (
    <div
      className={cn(
        'flex flex-no-wrap items-center gap-2 bg-background shadow-sm p-1 border rounded-2xl min-w-fit',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === 'separator') {
          return <SeparatorComponent key={`separator-${index}`} />
        }

        const Icon = tab.icon
        const isNotificationsTab =
          tab.title === 'Notifications' && (notificationCount ?? 0) > 0

        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={() => {
              handleSelect(index)
              navigate({ to: tab.to })
            }}
            transition={transition}
            className={cn(
              'relative flex flex-1 justify-center items-center px-4 py-2 rounded-xl font-medium text-xs tiny:text-sm text-center text-nowrap transition-colors duration-300',
              selected === index
                ? cn('bg-muted', activeColor)
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <div className="relative">
              {isNotificationsTab && (
                <>
                  <span className="-top-1 -left-2 absolute bg-rose-400 rounded-full w-4 h-4 animate-ping" />
                  <div className="-top-1 -left-2 absolute flex justify-center items-center bg-rose-500 rounded-full w-4 h-4 text-[10px] text-white">
                    {notificationCount ?? 0}
                  </div>
                </>
              )}
              <Icon className="size-3 tiny:size-5" />
            </div>

            <AnimatePresence initial={false}>
              {selected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden text-xs"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
