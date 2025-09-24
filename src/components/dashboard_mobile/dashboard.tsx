import { CalendarDateRangePicker } from '@/components/ui/daterangepicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Overview } from './overview'
import { BarChartIcon, LayoutDashboardIcon } from 'lucide-react'
import { Analytics } from './analytics'
import type { DateRange } from 'react-day-picker'
import { useState } from 'react'
import { subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getOrdersInRange } from '@/firebase/takeOrder'
import { getKitchenLedgerInRange } from '@/firebase/kitchenLedger'
import { getBakeryLedgerInRange } from '@/firebase/bakeryLedger'
import { getSeedBalance, getAllBalanceData } from '@/firebase/dailyBalances'
import SeedOpeningConfig from './seedOpeningConfig'

export default function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  // Format dates for query keys and API
  const from = date?.from ? format(date.from, 'yyyy-MM-dd') : ''
  const to = date?.to ? format(date.to, 'yyyy-MM-dd') : ''

  const incomeQuery = useQuery({
    queryKey: ['orderHistoryDashboard', from, to],
    queryFn: () => getOrdersInRange(from, to),

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const kitchenLedgerQuery = useQuery({
    queryKey: ['kitchenLedgerDashboard', from, to],
    queryFn: () => getKitchenLedgerInRange(from, to),

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const bakeryLedgerQuery = useQuery({
    queryKey: ['bakeryLedgerDashboard', from, to],
    queryFn: () => getBakeryLedgerInRange(from, to),

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  // Query for daily balance data - fetch ALL years (simple approach)
  const balanceDataQuery = useQuery({
    queryKey: ['allDailyBalances'],
    queryFn: getAllBalanceData,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  // Query for seed balance
  const seedBalanceQuery = useQuery({
    queryKey: ['seedBalance'],
    queryFn: getSeedBalance,
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
                  kitchenLedger={kitchenLedgerQuery.data || []}
                  bakeryLedger={bakeryLedgerQuery.data || []}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Analytics
                  rawOrders={incomeQuery.data || []}
                  kitchenLedger={kitchenLedgerQuery.data || []}
                  bakeryLedger={bakeryLedgerQuery.data || []}
                  balanceData={balanceDataQuery.data}
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
