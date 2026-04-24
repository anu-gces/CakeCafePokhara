import { CalendarDateRangePicker } from '@/components/ui/daterangepicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Overview } from './overview'
import { BarChartIcon, LayoutDashboardIcon } from 'lucide-react'
import { Analytics } from './analytics'
import type { DateRange } from 'react-day-picker'
import { useState } from 'react'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import SeedOpeningConfig, { type SeedBalance } from './seedOpeningConfig'
import { pb } from '@/lib/pocketbase'
import { type FetchedOrder } from '../restaurant_mobile/types'
import type { ExpenseLedger } from '@/routes/home/expenseLedger/$department'

export default function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  // Format dates for query keys and API
  const from = date?.from ? format(date.from, 'yyyy-MM-dd') : ''
  const to = date?.to ? format(date.to, 'yyyy-MM-dd') : ''

  const incomeQuery = useQuery<FetchedOrder[]>({
    queryKey: ['orderHistoryDashboard', date],
    queryFn: async () => {
      if (!date?.from || !date?.to) return []

      // 1. Local start/end (same as your working version)
      const localStart = startOfDay(date.from)
      const localEnd = endOfDay(date.to)

      // 2. Convert to ISO + replace T (your proven format)
      const startStr = localStart.toISOString().replace('T', ' ')
      const endStr = localEnd.toISOString().replace('T', ' ')

      return await pb.collection('orders').getFullList({
        filter: `created >= "${startStr}" && created <= "${endStr}" && complementary = false && status = "paid"`,
        sort: '-created',
        expand: 'createdBy',
        // expand: 'customerId, createdBy' // optional if you need it
      })
    },

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const expenseQuery = useQuery<ExpenseLedger[]>({
    queryKey: ['expenseHistoryDashboard', date],
    queryFn: async () => {
      if (!date?.from || !date?.to) return []

      // 1. Local start/end (same as your working version)
      const localStart = startOfDay(date.from)
      const localEnd = endOfDay(date.to)

      // 2. Convert to ISO + replace T (your proven format)
      const startStr = localStart.toISOString().replace('T', ' ')
      const endStr = localEnd.toISOString().replace('T', ' ')

      return await pb.collection('expenseLedger').getFullList({
        filter: `created >= "${startStr}" && created <= "${endStr}" && status = "paid"`,
        sort: '-created',
        expand: 'createdBy',
        // expand: 'customerId, createdBy' // optional if you need it
      })
    },

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  // Query for daily balance data - fetch ALL years (simple approach)
  const allLedgerQuery = useQuery<{
    orders: FetchedOrder[]
    expenseLedger: ExpenseLedger[]
  }>({
    queryKey: ['allLedger'],
    queryFn: async () => {
      const [orders, expenseLedger] = await Promise.all([
        pb.collection('orders').getFullList<FetchedOrder>({
          sort: '-created',
          filter: `complementary = false && status = "paid"`,
        }),
        pb.collection('expenseLedger').getFullList<ExpenseLedger>({
          sort: '-created',
          filter: `status = "paid"`,
        }),
      ])

      return {
        orders,
        expenseLedger,
      }
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  // Query for seed balance
  const seedBalanceQuery = useQuery<SeedBalance | undefined>({
    queryKey: ['seedBalance'],
    queryFn: async () => {
      try {
        return await pb.collection('seedConfig').getFirstListItem('')
      } catch (e) {
        return undefined
      }
    },

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  return (
    <>
      <div className="md:flex flex-col px-2 h-full overflow-y-auto">
        <div className="flex-1 space-y-4 pt-6 h-full">
          <Tabs
            defaultValue="overview"
            className="flex flex-col space-y-4 h-full"
          >
            <div className="flex flex-col gap-4">
              <TabsList className="flex-wrap w-full">
                <TabsTrigger value="overview" className="flex-1 min-w-0">
                  <LayoutDashboardIcon className="mr-2 w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1 min-w-0">
                  <BarChartIcon className="mr-2 w-4 h-4" /> Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="seedOpeningConfig"
                  className="flex-1 min-w-0"
                >
                  <BarChartIcon className="mr-2 w-4 h-4" /> Configure
                </TabsTrigger>
              </TabsList>
              <div className="flex justify-center sm:justify-end">
                <CalendarDateRangePicker value={date} onChange={setDate} />
              </div>
            </div>
            <TabsContent value="overview" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Overview
                  rawOrders={incomeQuery.data || []}
                  expenseLedger={expenseQuery.data || []}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Analytics
                  rawOrders={incomeQuery.data || []}
                  expenseLedger={expenseQuery.data || []}
                  allLedger={allLedgerQuery.data}
                  seedBalance={seedBalanceQuery.data}
                  dateRange={{ from, to }}
                />
              </div>
            </TabsContent>
            <TabsContent value="seedOpeningConfig" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <SeedOpeningConfig />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
