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

import {
  formatCompactNumber,
  groupRevenueData,
  mapToRevenueData,
} from './analytics.utils'
import { useLoaderData } from '@tanstack/react-router'

export interface RevenueData {
  timestamp: string
  income: number
  expenditure: number
}

export function AnalyticsLineChart({ data }: { data: RevenueData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400} className=" ">
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
        <Tooltip />
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

export function AnalyticsAreaChart({ data }: { data: RevenueData[] }) {
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
        <Tooltip />
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

const COLORS = [
  '#16A34A', // Emerald (green)
  '#F59E42', // Orange
  '#2563EB', // Blue
  '#E11D48', // Rose
  '#FACC15', // Yellow
  '#7C3AED', // Violet
]
// Pie chart component
function AnalyticsPieChart() {
  const { income } = useLoaderData({ from: '/home/dashboard' })
  // Aggregate income by category
  const categoryMap = income.reduce(
    (acc, order) => {
      order.items.forEach((item) => {
        const category = item.foodCategory || 'Uncategorized'
        const itemIncome = item.foodPrice * item.qty
        acc[category] = (acc[category] || 0) + itemIncome
      })
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to pie chart data format
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }))
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
          {/* used to be entry variable */}
          {pieData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className="rounded focus:outline-3 focus:outline-rose-500"
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function Analytics() {
  const { income, kitchenLedger, bakeryLedger } =
    useLoaderData({ from: '/home/dashboard' }) || [] // Default to empty array if no orders

  const revenueData = mapToRevenueData({ income, kitchenLedger, bakeryLedger })

  const data = groupRevenueData(revenueData)
  const totalIncome = revenueData.reduce((sum, item) => sum + item.income, 0)
  const totalExpenditure = revenueData.reduce(
    (sum, item) => sum + item.expenditure,
    0,
  )
  const totalOrders = revenueData.length
  //make avgchecksie upto 2 digits after decimal
  const avgCheckSize =
    totalOrders > 0 ? (totalIncome / totalOrders).toFixed(2) : 0

  const grossProfitMargin =
    totalIncome > 0
      ? (((totalIncome - totalExpenditure) / totalIncome) * 100).toFixed(1)
      : '0'

  return (
    <>
      <div className="gap-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="font-bold text-2xl">Rs.{totalIncome}</div>
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
            <div className="font-bold text-2xl"> Rs.{totalExpenditure}</div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Average Check Size
            </CardTitle>
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
            <div className="font-bold text-2xl">Rs.{avgCheckSize}</div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Gross Profit Margin
            </CardTitle>
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
              <path d="M22 12h-4m-2 0a6 6 0 01-6 6m6-6a6 6 0 006-6m6 0H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{grossProfitMargin}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-7 mt-4 pb-4">
        {/* Revenue Chart */}
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
                  {/* <div className="border-2 border-red-500">test</div> */}
                  <AnalyticsLineChart data={data} />
                </TabsContent>
                <TabsContent value="area">
                  <AnalyticsAreaChart data={data} />
                </TabsContent>
              </>
            </CardContent>
          </Tabs>
        </Card>

        {/* Pie Chart */}
        <Card className="order-2 lg:order-2 col-span-full lg:col-span-3 h-full">
          <CardHeader>
            <CardTitle>Sales by Menu Category</CardTitle>
            <CardDescription>
              Percentage of sales by menu category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
