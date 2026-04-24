'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import {
  HistoryIcon,
  PackageIcon,
  MinusIcon,
  TruckIcon,
  AlertTriangleIcon,
  RotateCcwIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
  LoaderIcon,
} from 'lucide-react'
import { template } from 'lodash'
import { pb } from '@/lib/pocketbase'
import { cn } from '@/lib/utils'
import { DatePickerWithPresets } from '@/components/ui/datepicker'

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

function getReasonIcon(reason: string) {
  const r = reason.toLowerCase()
  if (r.includes('restock')) return <TruckIcon className="w-4 h-4" />
  if (r.includes('waste')) return <AlertTriangleIcon className="w-4 h-4" />
  if (r.includes('sale') || r.includes('usage'))
    return <MinusIcon className="w-4 h-4" />
  if (r.includes('correction')) return <RotateCcwIcon className="w-4 h-4" />
  return <PackageIcon className="w-4 h-4" />
}

function getReasonColor(reason: string) {
  const r = reason.toLowerCase()

  if (r.includes('restock')) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
  }

  if (r.includes('waste') || r.includes('expiry') || r.includes('expired')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  if (r.includes('sale')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }

  if (r.includes('correction') || r.includes('adjust')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  }

  return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const formatTemplate = template('${year}-${month}-${day}, ${time}')
  return formatTemplate({
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  })
}

function HistoryItemCard({ item }: { item: InventoryHistoryProps }) {
  const stockChange = item.currentStockCount - item.lastStockCount
  const userName = getFormattedUser(item)

  return (
    <div className="flex gap-4 bg-card shadow-sm p-4 border rounded-lg">
      <div
        className={cn(
          'flex justify-center items-center rounded-full w-12 h-12 shrink-0',
          getReasonColor(item.reasonForStockEdit),
        )}
      >
        {getReasonIcon(item.reasonForStockEdit)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-sm truncate">{item.name}</h3>
          <Badge
            variant="outline"
            className={cn(
              'font-bold text-[10px] uppercase',
              getReasonColor(item.reasonForStockEdit),
            )}
          >
            {item.reasonForStockEdit}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-2 text-sm">
          <span className="text-muted-foreground">
            {item.lastStockCount} → {item.currentStockCount}
          </span>
          <span
            className={`font-bold ${stockChange > 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            ({stockChange > 0 ? '+' : ''}
            {stockChange})
          </span>
        </div>

        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            <span>{userName}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            <span>{formatTimestamp(item.created)}</span>
          </div>
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
    queryKey: ['inventoryHistory', selectedDate, selectedFilter],
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
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => setSelectedFilter('all')}
          >
            All
          </Button>
          <Button
            variant={selectedFilter === 'restock' ? 'default' : 'outline'}
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => setSelectedFilter('restock')}
          >
            Restock
          </Button>
          <Button
            variant={selectedFilter === 'sale' ? 'default' : 'outline'}
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => setSelectedFilter('sale')}
          >
            Sale
          </Button>
          <Button
            variant={selectedFilter === 'waste' ? 'default' : 'outline'}
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => setSelectedFilter('waste')}
          >
            Waste
          </Button>
          <Button
            variant={selectedFilter === 'correction' ? 'default' : 'outline'}
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => setSelectedFilter('correction')}
          >
            Correction
          </Button>
          <Button
            variant={selectedFilter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => setSelectedFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* History list */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
            <LoaderIcon className="mb-4 w-8 h-8 animate-spin" />
            <p className="text-sm">Loading inventory history...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <HistoryItemCard key={item.id} item={item} />
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
