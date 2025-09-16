'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import {
  HistoryIcon,
  PackageIcon,
  PlusIcon,
  MinusIcon,
  EditIcon,
  TruckIcon,
  AlertTriangleIcon,
  RotateCcwIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
  LoaderIcon,
} from 'lucide-react'
import { getAllInventoryHistory } from '@/firebase/inventoryManagement'
import { getAllUsers } from '@/firebase/firestore'
import type { UserAdditional } from '@/firebase/firestore'
import { template } from 'lodash'
import type { FoodItemProps } from '@/firebase/menuManagement'

// Helper function to get user display name
function getUserDisplayName(user: UserAdditional): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  } else if (user.firstName) {
    return user.firstName
  } else if (user.lastName) {
    return user.lastName
  } else {
    return user.email.split('@')[0] // Fallback to email username
  }
} // Function to get icon based on reason text
function getReasonIcon(reason: string) {
  const lowerReason = reason.toLowerCase()

  if (
    lowerReason.includes('restock') ||
    lowerReason.includes('delivery') ||
    lowerReason.includes('supply')
  ) {
    return <TruckIcon className="w-4 h-4" />
  } else if (
    lowerReason.includes('waste') ||
    lowerReason.includes('spoil') ||
    lowerReason.includes('expired')
  ) {
    return <AlertTriangleIcon className="w-4 h-4" />
  } else if (
    lowerReason.includes('usage') ||
    lowerReason.includes('used') ||
    lowerReason.includes('served')
  ) {
    return <MinusIcon className="w-4 h-4" />
  } else if (
    lowerReason.includes('edit') ||
    lowerReason.includes('update') ||
    lowerReason.includes('change')
  ) {
    return <EditIcon className="w-4 h-4" />
  } else if (lowerReason.includes('add') || lowerReason.includes('new')) {
    return <PlusIcon className="w-4 h-4" />
  } else if (
    lowerReason.includes('correction') ||
    lowerReason.includes('adjust')
  ) {
    return <RotateCcwIcon className="w-4 h-4" />
  } else {
    return <PackageIcon className="w-4 h-4" />
  }
}

// Function to get color based on reason text
function getReasonColor(reason: string) {
  const lowerReason = reason.toLowerCase()

  if (
    lowerReason.includes('restock') ||
    lowerReason.includes('delivery') ||
    lowerReason.includes('supply')
  ) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  } else if (
    lowerReason.includes('waste') ||
    lowerReason.includes('spoil') ||
    lowerReason.includes('expired')
  ) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  } else if (
    lowerReason.includes('usage') ||
    lowerReason.includes('used') ||
    lowerReason.includes('served')
  ) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  } else if (
    lowerReason.includes('edit') ||
    lowerReason.includes('update') ||
    lowerReason.includes('change')
  ) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  } else if (lowerReason.includes('add') || lowerReason.includes('new')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  } else if (
    lowerReason.includes('correction') ||
    lowerReason.includes('adjust')
  ) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
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

function HistoryEntryCard({
  entry,
  users,
}: {
  entry: FoodItemProps
  users: UserAdditional[]
}) {
  // Get user display name
  const user = users.find((u) => u.uid === entry.editedStockBy || '')
  const userDisplayName = user
    ? getUserDisplayName(user)
    : entry.editedStockBy || 'Unknown'

  const stockChange =
    (entry.currentStockCount || 0) - (entry.lastStockCount || 0)

  return (
    <div className="flex gap-3 bg-card p-4 border rounded-lg">
      {/* Icon */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full ${getReasonColor(entry.reasonForStockEdit || 'unknown')}`}
      >
        {getReasonIcon(entry.reasonForStockEdit || 'unknown')}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-sm truncate">{entry.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {entry.reasonForStockEdit || 'unknown'}
          </Badge>
        </div>

        {/* Simple stock change display */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground text-sm">
            {entry.lastStockCount} → {entry.currentStockCount} pieces
          </span>
          <span
            className={`text-sm font-semibold ${stockChange > 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            ({stockChange > 0 ? '+' : ''}
            {stockChange})
          </span>
        </div>

        {/* User and timestamp */}
        <div className="flex items-center gap-4 text-muted-foreground text-xs">
          <div className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            <span>{userDisplayName}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            <span>
              {formatTimestamp(entry.dateModified || new Date().toISOString())}
            </span>
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

  // Fetch inventory history using React Query
  const {
    data: inventoryHistory = [],
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ['inventoryHistory'],
    queryFn: getAllInventoryHistory,
  })

  console.log('fetched inventory history:', inventoryHistory)

  // Fetch all users to resolve names
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['allUsers'],
    queryFn: getAllUsers,
  })

  const isLoading = isLoadingHistory || isLoadingUsers
  const error = historyError || usersError

  // Filter history based on selected filter
  const filteredHistory = inventoryHistory.filter((entry) => {
    if (selectedFilter === 'all') return true
    return entry.reasonForStockEdit === selectedFilter
  })

  if (error) {
    return (
      <div className="bg-black">
        <div className="top-0 z-10 sticky bg-black backdrop-blur">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="sm" className="p-2">
              bitch
            </Button>
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              <h1 className="font-semibold text-lg">Inventory History</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
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
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            <h1 className="font-semibold text-lg">Inventory History</h1>
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
            {filteredHistory.map((entry) => (
              <HistoryEntryCard
                key={entry.historyId}
                entry={entry}
                users={users}
              />
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
