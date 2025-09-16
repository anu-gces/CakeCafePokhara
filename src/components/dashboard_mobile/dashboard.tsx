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

  return (
    <>
      <div className="md:flex flex-col px-2 h-full overflow-y-auto">
        <div className="flex-1 space-y-4 pt-6 h-full">
          <Tabs
            defaultValue="overview"
            className="flex flex-col space-y-4 h-full"
          >
            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">
                  <LayoutDashboardIcon className="mr-2 w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChartIcon className="mr-2 w-4 h-4" /> Analytics
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-nowrap items-center gap-2 min-w-0">
                <div className="flex-shrink">
                  <CalendarDateRangePicker value={date} onChange={setDate} />
                </div>
                {/* <Button className="flex-shrink gap-2">
                  <Download color="#ffffff" size={16} /> Download
                </Button>
                <Button className="flex-shrink gap-2" size="icon">
                  <Share color="#ffffff" size={16} />
                </Button> */}
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
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
