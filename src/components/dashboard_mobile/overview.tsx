import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLoaderData, useNavigate } from '@tanstack/react-router'
import { DollarSign } from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AnimatedCounter from '../ui/animatedCounter'
import { RecentSales } from './recentsales'
import { format, parseISO } from 'date-fns'

export function OverviewBarChart({
  data,
}: {
  data: { name: string; total: number }[]
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
            backgroundColor: '#1a1a1a', // Dark gray background
            border: '1px solid #404040', // Medium gray border
            borderRadius: '8px',
            color: '#ffffff', // White text
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', // Dark shadow
          }}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Overview() {
  const navigate = useNavigate()
  const { income: rawOrders } = useLoaderData({ from: '/home/dashboard' }) // Default to empty array if no orders

  const totalRevenue = rawOrders.reduce((sum, order) => {
    const subTotal = order.items.reduce(
      (itemSum, item) => itemSum + item.foodPrice * item.qty,
      0,
    )
    const discount = subTotal * (order.discountRate / 100)
    const tax = (subTotal - discount) * (order.taxRate / 100)
    const total = subTotal - discount + tax
    return sum + total
  }, 0)

  const ordersByDay = rawOrders.reduce((acc: Record<string, number>, order) => {
    // receiptDate is always an ISO string
    const day = format(parseISO(order.receiptDate), 'EEEE') // Get the day of the week
    acc[day] = (acc[day] || 0) + 1 // Increment the count for the day
    return acc
  }, {})

  // Handle the case when there are no orders or no data for the busiest day
  const sortedDays = Object.entries(ordersByDay).sort((a, b) => b[1] - a[1])
  const [busiestDay, busiestDaySales] =
    sortedDays.length > 0 ? sortedDays[0] : ['No data', 0]

  const totalSales = rawOrders.reduce((sum, order) => {
    const salesCount = order.items.reduce(
      (itemSum, item) => itemSum + item.qty,
      0,
    )
    return sum + salesCount
  }, 0)

  const topSellingItems = rawOrders
    .flatMap((order) => order.items)
    .reduce((acc: Record<string, number>, item) => {
      acc[item.foodName] = (acc[item.foodName] || 0) + item.qty
      return acc
    }, {})

  const sortedTopSellingItems = Object.entries(topSellingItems)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([foodName]) => foodName)
    .join(', ')

  const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
    const monthOrders = rawOrders.filter((order) => {
      // receiptDate is always an ISO string
      const month = parseISO(order.receiptDate).getMonth() // 0-indexed (Jan = 0)
      return month === index
    })

    const total = monthOrders.reduce((sum, order) => {
      const subTotal = order.items.reduce(
        (itemSum, item) => itemSum + item.foodPrice * item.qty,
        0,
      )
      const discount = subTotal * (order.discountRate / 100)
      const tax = (subTotal - discount) * (order.taxRate / 100)
      return sum + subTotal - discount + tax
    }, 0)

    return {
      name: format(new Date(2023, index), 'MMM'),
      total: Math.round(total),
    }
  })

  return (
    <>
      {/* Summary Cards - 2x2 on mobile */}
      <div className="gap-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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
              {busiestDaySales} orders were placed on this day.
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
              {totalSales} items sold this week
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Top Selling Items
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{sortedTopSellingItems}</div>
            <p className="text-muted-foreground text-xs">
              Based on Selected Range
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
        {/* RecentSales */}
        <Card
          className="order-2 lg:order-2 col-span-full lg:col-span-3 h-full active:scale-[0.995] transition-transform cursor-pointer"
          onClick={() =>
            navigate({
              to: '/home/billing',
            })
          }
        >
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Last 10 Sales. Click for more.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
