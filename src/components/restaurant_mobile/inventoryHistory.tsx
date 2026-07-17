import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { HistoryIcon, ArrowLeftIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { SplashScreen } from '../splashscreen'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { useQuery } from 'convex/react'

type InventoryHistoryProps = Doc<'inventoryHistory'>

// function groupHistoryItems(items: InventoryHistoryProps[]) {
//   const groups: InventoryHistoryProps[][] = []

//   for (const item of items) {
//     const itemTime = new Date(item.created).getTime()
//     const matchingGroup = groups.find((group) => {
//       const groupTime = new Date(group[0].created).getTime()
//       const sameUser =
//         group[0].expand?.editedStockBy?.username ===
//         item.expand?.editedStockBy?.username
//       return sameUser && Math.abs(itemTime - groupTime) <= 10_000
//     })

//     if (matchingGroup) {
//       matchingGroup.push(item)
//     } else {
//       groups.push([item])
//     }
//   }

//   return groups
// }

function HistoryItemCard({ items }: { items: InventoryHistoryProps[] }) {
  const first = items[0]
  const user = useQuery(api.users.getUserById, { id: first.editedBy })

  return (
    <div className="flex gap-4">
      <div className="w-16 text-right shrink-0">
        <span className="text-[11px] text-muted-foreground">
          {new Date(first._creationTime).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      <div className="flex-1 pt-1 border-t">
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-muted-foreground">
          {/* <span>{getFormattedUser(first)}</span> */}
          <span>{user?.name || user?.email || 'Anonymous'}</span>
          <span>·</span>
          <span>{first.reasonForStockEdit}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {items.map((item) => {
            const delta = item.currentStock - item.previousStock
            return (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-sm">{item.itemName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {item.previousStock} → {item.currentStock}
                  </span>
                  <span
                    className={cn(
                      'font-medium text-xs',
                      delta > 0
                        ? 'text-green-700'
                        : delta < 0
                          ? 'text-red-700'
                          : 'text-muted-foreground',
                    )}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function InventoryHistory() {
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'restock' | 'sale' | 'waste' | 'correction' | 'damage'
  >('all')

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )

  const selectedDayMS = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date()
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }, [selectedDate])

  const rawHistoryData = useQuery(
    api.restaurant.inventoryHistory.listInventoryHistory,
    {
      selectedDay: selectedDayMS,
    },
  )
  // 2. Client-side filtering matching BOTH the selected specific calendar date and categorical chip
  const filteredHistory = useMemo(() => {
    if (!rawHistoryData) return []

    return rawHistoryData.filter((item: InventoryHistoryProps) => {
      // Step A: Check if it matches the specific calendar day picked (e.g. July 17, 2003)
      if (selectedDate) {
        const itemDate = new Date(item._creationTime)
        const isSameDay =
          itemDate.getDate() === selectedDate.getDate() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getFullYear() === selectedDate.getFullYear()

        if (!isSameDay) return false
      }

      // Step B: Filter matching target category tab selection
      if (selectedFilter === 'all') return true
      return item.reasonForStockEdit === selectedFilter
    })
  }, [rawHistoryData, selectedDate, selectedFilter])

  // Convex returns undefined while loading the initial websocket connection block
  if (rawHistoryData === undefined) {
    return <SplashScreen />
  }

  return (
    <div className="bg-background h-full overflow-auto">
      {/* Header */}
      <div className="top-0 z-10 sticky bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
        <div className="flex items-center gap-3 p-4">
          <Link
            to="/home/inventoryManagement"
            search={{ category: 'appetizers' }}
            viewTransition={{ types: ['slide-right'] }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-primary transition-colors"
            title="Go to Inventory Management"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              <h1 className="font-semibold text-lg">Inventory History</h1>
            </div>
            <DatePickerWithPresets
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <Tabs
            value={selectedFilter}
            onValueChange={(value) =>
              setSelectedFilter(value as typeof selectedFilter)
            }
          >
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="restock">Restock</TabsTrigger>
              <TabsTrigger value="sale">Sale</TabsTrigger>
              <TabsTrigger value="waste">Waste</TabsTrigger>
              <TabsTrigger value="correction">Correction</TabsTrigger>
              <TabsTrigger value="damage">Damage</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* History list */}
      <div className="mx-auto p-4 w-full sm:w-[640px]">
        {filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {filteredHistory.map((item, index) => (
              <HistoryItemCard key={item._id ?? index} items={[item]} />
            ))}
          </div>
        ) : selectedFilter !== 'all' ? (
          <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
            <HistoryIcon className="opacity-50 mb-4 w-12 h-12" />
            <p className="text-sm">No {selectedFilter} entries found</p>
            <p className="mt-1 text-xs">
              Try selecting a different filter or check back later
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
            <HistoryIcon className="opacity-50 mb-4 w-12 h-12" />
            <p className="text-sm">No history entries found</p>
            <p className="mt-1 text-xs">
              History will appear here once you start managing inventory
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
