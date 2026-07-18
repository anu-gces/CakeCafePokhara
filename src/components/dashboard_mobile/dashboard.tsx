import { CalendarDateRangePicker } from '@/components/ui/daterangepicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Overview } from './overview'
import { BarChartIcon, LayoutDashboardIcon } from 'lucide-react'
import { Analytics } from './analytics'
import type { DateRange } from 'react-day-picker'
import { useMemo, useState } from 'react'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import SeedOpeningConfig from './seedOpeningConfig'
import type { Doc } from '../../../convex/_generated/dataModel'
import { useLoaderData } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { InlineLoader } from '../splashscreen'
import { ScrollArea } from '../ui/scroll-area'

export default function Dashboard() {
  const { branches } = useLoaderData({ from: '/home/dashboard' })
  const [selectedBranch, setSelectedBranch] = useState<Doc<'branches'>>(
    branches[0],
  )
  const [activeView, setActiveView] = useState('overview')
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  const dailyStats = useQuery(api.dashboard.dailyStats.getDashboard, {
    branchId: selectedBranch._id,
  })

  const seedBalance = useQuery(api.dashboard.seedBalance.getSeedBalance, {
    branchId: selectedBranch._id,
  })

  const fromTime = date?.from ? startOfDay(date.from) : undefined
  const toTime = date?.to ? endOfDay(date.to) : undefined

  const filteredStats = useMemo(() => {
    if (!dailyStats) return []
    if (fromTime === undefined || toTime === undefined) return dailyStats

    const startTarget = fromTime.getTime()
    const endTarget = toTime.getTime()

    return dailyStats.filter(
      (stat) => stat.date >= startTarget && stat.date <= endTarget,
    )
  }, [dailyStats, fromTime, toTime])

  if (!branches || branches.length === 0) {
    return <div>No branches found.</div>
  }

  if (dailyStats === undefined || seedBalance === undefined) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <InlineLoader />
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="md:flex flex-col px-2 h-full overflow-y-auto">
        <div className="flex-1 space-y-4 pt-6 h-full">
          <div className="flex flex-row justify-between">
            <Tabs
              value={selectedBranch?._id}
              onValueChange={(id) => {
                const match = branches.find((b) => b._id === id)
                if (match) {
                  setSelectedBranch(match)
                }
              }}
            >
              <TabsList>
                {branches.map((branch) => (
                  <TabsTrigger key={branch._id} value={branch._id}>
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <CalendarDateRangePicker value={date} onChange={setDate} />
          </div>
          <Tabs
            defaultValue="overview"
            value={activeView}
            onValueChange={setActiveView}
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
            </div>
            <TabsContent value="overview" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Overview dailyStats={filteredStats} />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Analytics
                  dailyStats={dailyStats}
                  dateRange={{ from: fromTime!, to: toTime! }}
                  seedBalance={seedBalance ?? undefined}
                />
              </div>
            </TabsContent>
            <TabsContent value="seedOpeningConfig" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <SeedOpeningConfig selectedBranch={selectedBranch} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </>
  )
}
