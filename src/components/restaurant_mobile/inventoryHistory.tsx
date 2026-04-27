'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { HistoryIcon, AlertTriangleIcon, ArrowLeftIcon } from 'lucide-react'
import { pb } from '@/lib/pocketbase'
import { cn } from '@/lib/utils'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { SplashScreen } from '../splashscreen'

export interface InventoryHistoryProps {
  id: string // PocketBase record ID
  reasonForStockEdit: 'restock' | 'sale' | 'waste' | 'correction' | 'cancelled'
  name: string // Name of the food item
  lastStockCount: number // Stock count before the change
  currentStockCount: number // Stock count after the change
  created: string // ISO timestamp of when the change was made
  updated: string // ISO timestamp of when the change was last updated
  expand?: {
    editedStockBy: {
      username: string
      firstName: string
      lastName: string
    }
  }
}

// Helper function to get user display name
function getFormattedUser(item: InventoryHistoryProps): string {
  const user = item.expand?.editedStockBy
  if (!user) return 'System'

  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  return user.username
}

function groupHistoryItems(items: InventoryHistoryProps[]) {
  const groups: InventoryHistoryProps[][] = []

  for (const item of items) {
    const itemTime = new Date(item.created).getTime()
    const matchingGroup = groups.find((group) => {
      const groupTime = new Date(group[0].created).getTime()
      const sameUser =
        group[0].expand?.editedStockBy?.username ===
        item.expand?.editedStockBy?.username
      return sameUser && Math.abs(itemTime - groupTime) <= 10_000
    })

    if (matchingGroup) {
      matchingGroup.push(item)
    } else {
      groups.push([item])
    }
  }

  return groups
}

function HistoryItemCard({ items }: { items: InventoryHistoryProps[] }) {
  const first = items[0]

  return (
    <div className="flex gap-4">
      <div className="w-16 text-right shrink-0">
        <span className="text-[11px] text-muted-foreground">
          {new Date(first.created).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      <div className="flex-1 pt-1 border-t">
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-muted-foreground">
          <span>{getFormattedUser(first)}</span>
          <span>·</span>
          <span>{first.reasonForStockEdit}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {items.map((item) => {
            const delta = item.currentStockCount - item.lastStockCount
            return (
              <div key={item.id} className="flex justify-between items-center">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {item.lastStockCount} → {item.currentStockCount}
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
  // State for filter
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'restock' | 'sale' | 'waste' | 'correction' | 'cancelled'
  >('all')

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  )

  // Fetch inventory history using React Query
  const {
    data: inventoryHistory = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventoryHistory', selectedDate],
    queryFn: async () => {
      const start = new Date(selectedDate!)
      start.setHours(0, 0, 0, 0)

      const end = new Date(selectedDate!)
      end.setHours(23, 59, 59, 999)

      const filter = `created >= "${start.toISOString()}" && created <= "${end.toISOString()}"`

      return pb
        .collection('inventoryHistory')
        .getFullList<InventoryHistoryProps>({
          sort: '-created',
          expand: 'editedStockBy',
          filter,
        })
    },
  })

  // Filter history based on selected filter
  const filteredHistory = inventoryHistory.filter((item) => {
    if (selectedFilter === 'all') return true
    return item.reasonForStockEdit === selectedFilter
  })

  if (error) {
    return (
      <div className="">
        <div className="top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              <h1 className="font-semibold text-lg">Inventory History</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center py-12">
          <AlertTriangleIcon className="opacity-50 mb-4 w-12 h-12" />
          <p className="text-sm">Failed to load inventory history</p>
          <p className="mt-1 text-xs">Please try again later</p>
        </div>
      </div>
    )
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

              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* History list */}
      <div className="mx-auto p-4 w-full sm:w-[640px]">
        {isLoading ? (
          <SplashScreen />
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {groupHistoryItems(filteredHistory).map((group) => (
              <HistoryItemCard key={group[0].id} items={group} />
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
