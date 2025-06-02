import { useEffect, useState } from 'react'
import { listenToKanbanCardDocument } from '@/firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Clock,
  PackageOpenIcon,
  UtensilsIcon,
  CheckCircle2,
  Loader2,
  HandIcon,
} from 'lucide-react'
import type { CardType } from './ui/kanbanBoard'
import { Outlet } from '@tanstack/react-router'
import { ExpandableTabs, type TabItem } from './ui/expandable-tabs'

const tabs: TabItem[] = [
  {
    title: 'Orders',
    icon: UtensilsIcon,
    to: '/home/notifications/orderNotification',
  },
  { type: 'separator' },
  {
    title: 'Stocks',
    icon: PackageOpenIcon,
    to: '/home/notifications/stockNotification',
  },
]

export function Notifications() {
  return (
    <div>
      <div>
        <ExpandableTabs className="ml-4 max-w-48" tabs={tabs} />
      </div>
      <Outlet />
    </div>
  )
}

export function StockNotification() {
  const [items, setItems] = useState<CardType[] | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = listenToKanbanCardDocument((items) => {
      setItems(items)
      setError(false) // reset error if data is valid
    })

    return () => unsubscribe()
  }, [])

  const alerts = (items || []).filter(
    (item) => item.column === 'runningLow' || item.column === 'outOfStock',
  )

  if (items === null)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="flex flex-col items-center animate-pulse">
          <div className="bg-muted mb-2 rounded-full w-12 h-12"></div>
          <div className="bg-muted rounded w-32 h-4"></div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-2 w-10 h-10 text-destructive" />
        <p className="font-medium text-destructive">
          Failed to load notifications
        </p>
      </div>
    )

  if (alerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex bg-muted/30 mb-3 p-4 rounded-full">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No active alerts at the moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {alerts.map(({ id, title, displayName, updatedAt, column, category }) => (
        <div
          key={id}
          className="group relative bg-gradient-to-br from-card to-card/80 shadow-md hover:shadow-lg p-4 border rounded-xl overflow-hidden transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:to-accent/10 transition-all duration-500"></div>

          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-1 self-stretch rounded-full ${
                column === 'outOfStock' ? 'bg-rose-500' : 'bg-yellow-300'
              }`}
            />

            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold group-hover:text-primary text-base transition-colors">
                    {title}
                  </h3>
                  {/* Category Chip */}
                  <span className="inline-flex items-center bg-blue-100 px-2 py-0.5 rounded-full font-medium text-blue-600 text-xs">
                    {category}
                  </span>
                </div>
                <span className="flex items-center gap-1 bg-muted/50 ml-2 px-2 py-0.5 rounded-full text-muted-foreground text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <div className="flex items-center text-muted-foreground text-sm">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                    column === 'outOfStock'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-yellow-400/10 text-yellow-600'
                  }`}
                >
                  {column === 'outOfStock' ? 'Out of Stock' : 'Running Low'}
                </span>

                <div className="flex items-center gap-1">
                  <span className="font-medium">marked by {displayName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-0 left-0 absolute bg-gradient-to-r from-transparent via-muted/50 group-hover:via-primary/30 to-transparent w-full h-0.5 transition-all duration-300"></div>
        </div>
      ))}
    </div>
  )
}

export function OrderNotification() {
  const orders = [
    {
      id: 'order-1',
      status: 'pending',
      tableNumber: 4,
      items: ['Masala Dosa', 'Chai'],
      remarks: '',
      createdAt: new Date(Date.now() - 3 * 60 * 1000),
    },
    {
      id: 'order-2',
      status: 'in_progress',
      tableNumber: 7,
      items: ['Paneer Butter Masala', '2x Naan'],
      remarks: 'No butter on naan',
      createdAt: new Date(Date.now() - 9 * 60 * 1000),
    },
    {
      id: 'order-3',
      status: 'ready',
      tableNumber: 2,
      items: ['Thukpa', 'Iced Tea'],
      remarks: 'Extra lemon',
      createdAt: new Date(Date.now() - 18 * 60 * 1000),
    },
    {
      id: 'order-4',
      status: 'served',
      tableNumber: 5,
      items: ['Pizza', 'Mojito'],
      remarks: '',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]

  return (
    <div className="space-y-3 p-3">
      {orders.map(({ id, status, tableNumber, items, remarks, createdAt }) => (
        <div
          key={id}
          className="group bg-card shadow-sm hover:shadow-md p-4 border rounded-xl transition"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <UtensilsIcon className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-sm">Table {tableNumber}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : status === 'ready'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
              }`}
            >
              {status === 'pending' && <Clock className="w-3 h-3" />}
              {status === 'in_progress' && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {status === 'ready' && <CheckCircle2 className="w-3 h-3" />}
              {status === 'served' && <HandIcon className="w-3 h-3" />}
              {status.charAt(0).toUpperCase() +
                status.slice(1).replace('_', ' ')}
            </span>
          </div>

          <div className="mb-1 text-muted-foreground text-sm">
            {items.join(', ')}
          </div>

          {remarks && (
            <div className="mb-1 text-muted-foreground text-xs italic">
              “{remarks}”
            </div>
          )}

          <div className="text-muted-foreground text-xs">
            Placed {formatDistanceToNow(createdAt, { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  )
}
