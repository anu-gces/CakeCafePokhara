import { ExpandableTabs } from './ui/expandable-tabs-vanilla'
import { KanbanBoard } from './ui/kanbanBoard'
import {
  UtensilsIcon,
  DonutIcon,
  MonitorIcon,
  CakeIcon,
  BeerIcon,
  SearchIcon,
} from 'lucide-react' // Import relevant icons
import type { TabItem } from './ui/expandable-tabs-vanilla'
import { Input } from './ui/input'
import { useState } from 'react'

export type kanbanCategory =
  | 'Kitchen'
  | 'Bar'
  | 'DonutStation'
  | 'Counter'
  | 'Bakery'

const tabs: TabItem[] = [
  { title: 'Kitchen', icon: UtensilsIcon, search: 'Kitchen' },
  { title: 'Bar', icon: BeerIcon, search: 'Bar' },
  { title: 'Donut Station', icon: DonutIcon, search: 'DonutStation' },
  { title: 'Counter', icon: MonitorIcon, search: 'Counter' },
  { title: 'Bakery', icon: CakeIcon, search: 'Bakery' },
]

export function Stock() {
  const [search, setSearch] = useState('')
  return (
    <>
      <div className="flex flex-col gap-2 px-2 w-full h-full">
        {/* Set flex-grow-0 and flex-shrink-0 to prevent stretching */}
        <div className="flex justify-start gap-4">
          <ExpandableTabs tabs={tabs} to="/home/stock" />
          <div className="relative px-4 py-2">
            <SearchIcon className="top-1/2 left-8 absolute w-5 h-5 text-muted-foreground -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              // No placeholder needed
            />
          </div>
        </div>
        {/* {search && <p className="mb-2 ml-4 text-gray-500 text-xs italic">Showing results across all categories</p>} */}

        <KanbanBoard search={search} />
      </div>
    </>
  )
}
