import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import type { kanbanCategory } from '../stock'

type MenuCategory =
  | 'appetizers'
  | 'main_courses'
  | 'desserts'
  | 'beverages'
  | 'bakery'
  | 'kitchen'
  | 'orders'
  | 'specials'
  | 'hard_drinks'
  | 'others'

interface Tab {
  title: string
  icon: LucideIcon
  type?: never
  search: kanbanCategory | MenuCategory
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
  to: Exclude<LinkProps['to'], '.' | '..' | undefined>
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

const transition = { delay: 0.1, type: 'spring', bounce: 0, duration: 0.6 }

const Separator = React.memo(() => (
  <div className="mx-1 bg-border w-[1.2px] h-[24px]" aria-hidden="true" />
))

const TabButton = React.memo(function TabButton({
  tab,
  index,
  selected,
  handleSelect,
}: {
  tab: Tab
  index: number
  selected: boolean
  handleSelect: (index: number) => void
}) {
  const Icon = tab.icon
  return (
    <motion.button
      key={tab.title}
      variants={buttonVariants}
      initial={false}
      animate="animate"
      custom={selected}
      onClick={() => {
        handleSelect(index)
      }}
      transition={transition}
      className={cn(
        'relative flex flex-1 justify-center items-center rounded-xl px-0  text-black dark:text-white py-2 text-sm font-medium text-nowrap transition-colors duration-300',
        selected
          ? cn('bg-muted')
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="w-3 md:w-5" />
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            variants={spanVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="overflow-hidden text-[9px] md:text-base"
          >
            {tab.title}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
})

export function ExpandableTabs({
  tabs,
  to,
  className,
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(0)
  const navigate = useNavigate({ from: to })

  const handleSelect = (index: number) => {
    setSelected(index)
    onChange?.(index)

    // Update the search parameter when a tab is selected
    const selectedTab = tabs[index]
    if ('search' in selectedTab) {
      navigate({ search: { category: selectedTab.search } })
    }
  }

  return (
    <div
      className={cn(
        'flex  flex-no-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm',
        className,
      )}
    >
      {tabs.map((tab, index) =>
        tab.type === 'separator' ? (
          <Separator key={`separator-${index}`} />
        ) : (
          <TabButton
            key={tab.title}
            tab={tab}
            index={index}
            selected={selected === index}
            handleSelect={handleSelect}
          />
        ),
      )}
    </div>
  )
}
