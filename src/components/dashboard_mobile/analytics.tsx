import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { format, startOfDay, endOfDay } from 'date-fns'
import { formatCompactNumber } from './analytics.utils'
import AnimatedCounter from '../ui/animatedCounter'
import {
  CreditCardIcon,
  TrendingUpIcon,
  CalendarIcon,
  WalletIcon,
} from 'lucide-react'

import type { Doc } from '../../../convex/_generated/dataModel'

type DailyStat = Doc<'dailyStats'>

interface ChartRow {
  timestamp: string
  income: number
  expenditure: number
  sales: number
}

export function AnalyticsLineChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ right: 12, left: 12 }}>
        <XAxis
          dataKey="timestamp"
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
          tickFormatter={formatCompactNumber}
          width={20}
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
        <CartesianGrid stroke="#ccc" strokeWidth={1} strokeDasharray="5 5" />
        <Legend align="right" verticalAlign="top" />

        <Line
          type="linear"
          dataKey="income"
          stroke="#16a34a"
          activeDot={{ r: 8 }}
          dot={true}
        />
        <Line
          type="linear"
          dataKey="expenditure"
          stroke="#e11d48"
          activeDot={{ r: 8 }}
          dot={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AnalyticsAreaChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ right: 12, left: 12 }}>
        <defs>
          <linearGradient id="expenditureGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="timestamp"
          stroke="#888888"
          fontSize={12}
          tickLine={true}
          axisLine={true}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={true}
          axisLine={true}
          tickFormatter={formatCompactNumber}
          width={20}
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
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <Legend align="right" verticalAlign="top" />

        <Area
          type="natural"
          dataKey="income"
          stroke="#10B981"
          fill="url(#incomeGradient)"
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="natural"
          dataKey="income"
          stroke="#10B981"
          isAnimationActive={true}
        />

        <Area
          type="natural"
          dataKey="expenditure"
          stroke="#e11d48"
          fill="url(#expenditureGradient)"
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
        <Line type="natural" dataKey="expenditure" stroke="#e11d48" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Analytics({
  dailyStats,
  seedBalance,
  dateRange,
}: {
  dailyStats: DailyStat[]
  seedBalance: Doc<'seedBalance'> | undefined
  dateRange: { from: Date; to: Date }
}) {
  const fromDate = dateRange.from
  const toDate = dateRange.to

  // Get filtered stats for the selected date window
  const periodStats = dailyStats.filter((stat) => {
    const d = new Date(stat.date)
    return d >= startOfDay(fromDate) && d <= endOfDay(toDate)
  })

  //Sum up metrics for the current active period
  const totalIncome = periodStats.reduce((sum, s) => sum + s.revenue, 0)
  const totalExpenditure = periodStats.reduce((sum, s) => sum + s.expenses, 0)
  const totalSales = periodStats.reduce((sum, s) => sum + s.salesCount, 0)

  // Compute Opening Balance accurately up until the start of fromDate
  const calculateOpeningBalance = () => {
    if (!seedBalance) return 0
    const seedDate = new Date(seedBalance.date)

    const priorStats = dailyStats.filter((s) => {
      const d = new Date(s.date)
      return d > seedDate && d < startOfDay(fromDate)
    })

    const income = priorStats.reduce((sum, s) => sum + s.revenue, 0)
    const expenditure = priorStats.reduce((sum, s) => sum + s.expenses, 0)

    return seedBalance.amount + income - expenditure
  }

  const openingBalance = calculateOpeningBalance()

  // Derive closing balance directly from opening balance to prevent day-boundary leakage
  const closingBalance = openingBalance + totalIncome - totalExpenditure

  const formatDateRange = () => {
    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return fromDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    const fromFormatted = fromDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const toFormatted = toDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    return `${fromFormatted} - ${toFormatted}`
  }

  const dateRangeText = formatDateRange()

  const data: ChartRow[] = [...periodStats]
    .sort((a, b) => a.date - b.date)
    .map((s) => ({
      timestamp: format(new Date(s.date), 'MMM d'),
      income: Math.round(s.revenue),
      expenditure: Math.round(s.expenses),
      sales: s.salesCount,
    }))

  const avgCheckSize = totalSales > 0 ? totalIncome / totalSales : 0
  const grossProfitMargin =
    totalIncome > 0 ? ((totalIncome - totalExpenditure) / totalIncome) * 100 : 0

  return (
    <>
      <div className="gap-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Income</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="green"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-4 h-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              Rs. <AnimatedCounter from={0} to={totalIncome} />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Expenditure
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="red"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              Rs. <AnimatedCounter from={0} to={totalExpenditure} />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Average Check Size
            </CardTitle>
            <CreditCardIcon stroke="gray" className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              Rs. {avgCheckSize.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Gross Profit Margin
            </CardTitle>
            <TrendingUpIcon className="w-4 h-4" stroke="green" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {grossProfitMargin.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Opening Balance
            </CardTitle>
            <WalletIcon stroke="blue" className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              Rs. <AnimatedCounter from={0} to={openingBalance} />
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              {dateRangeText}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Closing Balance
            </CardTitle>
            <CalendarIcon stroke="purple" className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              Rs. <AnimatedCounter from={0} to={closingBalance} />
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              {dateRangeText}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-7 mt-4 pb-4">
        <Card className="order-1 lg:order-1 col-span-full lg:col-span-4 h-full">
          <Tabs defaultValue="line" className="flex flex-col p-0">
            <CardHeader>
              <CardTitle className="flex flex-row justify-between">
                <div>Revenue Chart</div>
                <div className="flex flex-row gap-2">
                  <TabsList>
                    <TabsTrigger value="line">Line</TabsTrigger>
                    <TabsTrigger value="area">Area</TabsTrigger>
                  </TabsList>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative m-0 p-0 h-full">
              <>
                <TabsContent value="line">
                  <AnalyticsLineChart data={data} />
                </TabsContent>
                <TabsContent value="area">
                  <AnalyticsAreaChart data={data} />
                </TabsContent>
              </>
            </CardContent>
          </Tabs>
        </Card>

        <Card className="order-2 lg:order-2 col-span-full lg:col-span-3 h-full">
          <CardHeader>
            <CardTitle>Sales Volume</CardTitle>
            <CardDescription>Number of sales per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentMethodChart data={periodStats} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

const COLORS = [
  '#10B981', // Bank
  '#3B82F6', // Cash
  '#F59E0B', // eSewa
]

function PaymentMethodChart({ data }: { data: DailyStat[] }) {
  const totals = data.reduce(
    (acc, s) => {
      acc.cash += s.paymentBreakdown.cash
      acc.esewa += s.paymentBreakdown.esewa
      acc.bank += s.paymentBreakdown.bank
      return acc
    },
    { cash: 0, esewa: 0, bank: 0 },
  )

  const pieData = [
    { name: 'Bank', value: Math.round(totals.bank * 100) / 100 },
    { name: 'Cash', value: Math.round(totals.cash * 100) / 100 },
    { name: 'eSewa', value: Math.round(totals.esewa * 100) / 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          dataKey="value"
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={110}
          innerRadius={75}
          fill="#8884d8"
          label
        >
          {pieData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className="rounded focus:outline-3 focus:outline-rose-500"
            />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            color: '#ffffff',
          }}
          labelStyle={{ color: '#ffffff' }}
          itemStyle={{ color: '#ffffff' }}
          formatter={(value: number, name: string) => [
            `Rs. ${value.toFixed(2)}`,
            name,
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
