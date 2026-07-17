import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DollarSign, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import AnimatedCounter from '../ui/animatedCounter'
import type { Doc } from '../../../convex/_generated/dataModel'

type DailyStat = Doc<'dailyStats'>

export function OverviewBarChart({
  data,
}: {
  data: { name: string; revenue: number; expense: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ right: 16, left: 16 }}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={true}
          axisLine={true}
          minTickGap={0}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={true}
          axisLine={true}
          width={20}
          tickFormatter={(value) => `Rs.${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040',
            borderRadius: '8px',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#16a34a"
          radius={[4, 4, 0, 0]}
          name="Revenue"
          animationDuration={1000}
        />
        <Bar
          dataKey="expense"
          fill="#e11d48"
          radius={[4, 4, 0, 0]}
          name="Expense"
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Overview({ dailyStats }: { dailyStats: DailyStat[] }) {
  const totalRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0)
  const totalSales = dailyStats.reduce((sum, d) => sum + d.salesCount, 0)

  const salesByDay = dailyStats.reduce((acc: Record<string, number>, stat) => {
    const day = format(new Date(stat.date), 'EEEE')
    acc[day] = (acc[day] || 0) + stat.salesCount
    return acc
  }, {})

  const sortedDays = Object.entries(salesByDay).sort((a, b) => b[1] - a[1])
  const [busiestDay, busiestDaySales] =
    sortedDays.length > 0 ? sortedDays[0] : ['No data', 0]

  const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
    const monthStats = dailyStats.filter(
      (stat) => new Date(stat.date).getMonth() === index,
    )

    const revenue = monthStats.reduce((sum, s) => sum + s.revenue, 0)
    const expense = monthStats.reduce((sum, s) => sum + s.expenses, 0)

    return {
      name: format(new Date(2023, index), 'MMM'),
      revenue: Math.round(revenue),
      expense: Math.round(expense),
    }
  })

  return (
    <>
      {/* Summary Cards - 2x2 on mobile */}
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3">
        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
            <DollarSign color="green" size={16} />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              Rs.
              <AnimatedCounter from={0} to={totalRevenue} />
            </div>
            <p className="text-muted-foreground text-xs">
              This month's total revenue
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Busiest Day</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-4 h-4 text-muted-foreground"
            >
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{busiestDay}</div>
            <p className="text-muted-foreground text-sm">
              {busiestDaySales} sales were recorded on this day.
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Sales</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-4 h-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              <AnimatedCounter from={0} to={totalSales} />
            </div>
            <p className="text-muted-foreground text-xs">
              {totalSales} sales recorded this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Cards */}
      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-7 mt-4 pb-4">
        <Card className="order-1 lg:order-1 col-span-full lg:col-span-4 h-full">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Bar chart of monthly revenue.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewBarChart data={monthlyRevenue} />
          </CardContent>
        </Card>
        <Card className="order-2 lg:order-2 col-span-full lg:col-span-3 h-full">
          <CardHeader>
            <CardTitle>Profitability</CardTitle>
            <CardDescription>Net profit trend for the period.</CardDescription>
          </CardHeader>
          <CardContent>
            <NetProfitCard dailyStats={dailyStats} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function NetProfitCard({ dailyStats }: { dailyStats: DailyStat[] }) {
  const totalProfit = dailyStats.reduce(
    (sum, d) => sum + (d.revenue - d.expenses),
    0,
  )

  const avgDailyProfit =
    dailyStats.length > 0 ? totalProfit / dailyStats.length : 0

  // Compare the most recent half of the range to the earlier half,
  // just to show a directional trend — no extra data needed.
  const sorted = [...dailyStats].sort((a, b) => a.date - b.date)
  const mid = Math.floor(sorted.length / 2)
  const firstHalfProfit = sorted
    .slice(0, mid)
    .reduce((sum, d) => sum + (d.revenue - d.expenses), 0)
  const secondHalfProfit = sorted
    .slice(mid)
    .reduce((sum, d) => sum + (d.revenue - d.expenses), 0)

  const isUp = secondHalfProfit >= firstHalfProfit

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">Net Profit</CardTitle>
        {isUp ? (
          <TrendingUpIcon size={16} className="text-green-600" />
        ) : (
          <TrendingDownIcon size={16} className="text-red-600" />
        )}
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">
          Rs.
          <AnimatedCounter from={0} to={Math.round(totalProfit)} />
        </div>
        <p className="text-muted-foreground text-xs">
          Rs.{Math.round(avgDailyProfit)} average per day
        </p>
      </CardContent>
    </Card>
  )
}
