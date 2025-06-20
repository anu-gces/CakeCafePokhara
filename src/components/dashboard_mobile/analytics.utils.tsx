import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import type { RevenueData } from './analytics'
import type { ProcessedOrder } from '@/firebase/firestore'
import type { KitchenLedgerItem } from '@/routes/home/kitchenLedger'
import type { BakeryLedgerItem } from '@/routes/home/bakeryLedger'

export function groupDataByHour(dataArray: RevenueData[]) {
  return Object.values(
    dataArray
      .map((data) => ({
        timestamp: format(parseISO(data.timestamp), 'HH:00'),
        income: data.income,
        expenditure: data.expenditure,
      }))
      .reduce(
        (acc, data) => {
          if (!acc[data.timestamp]) {
            acc[data.timestamp] = {
              timestamp: data.timestamp,
              income: 0,
              expenditure: 0,
            }
          }

          acc[data.timestamp].income += data.income
          acc[data.timestamp].expenditure += data.expenditure

          return acc
        },
        {} as { [key: string]: RevenueData },
      ),
  )
}

export function groupDataByDay(dataArray: RevenueData[]) {
  return Object.values(
    dataArray
      .map((data) => ({
        timestamp: format(parseISO(data.timestamp), 'MMM-dd'),
        income: data.income,
        expenditure: data.expenditure,
      }))
      .reduce(
        (acc, data) => {
          if (!acc[data.timestamp]) {
            acc[data.timestamp] = {
              timestamp: data.timestamp,
              income: 0,
              expenditure: 0,
            }
          }

          acc[data.timestamp].income += data.income
          acc[data.timestamp].expenditure += data.expenditure

          return acc
        },
        {} as { [key: string]: RevenueData },
      ),
  )
}

export function groupDataByWeek(dataArray: RevenueData[]) {
  const firstDate = parseISO(dataArray[0].timestamp)

  return Object.values(
    dataArray
      .map((data) => {
        const date = parseISO(data.timestamp)
        const diffDays = differenceInDays(date, firstDate)
        const diffWeeks = Math.floor(diffDays / 7)
        const weekStart = addDays(firstDate, diffWeeks * 7)

        return {
          timestamp: format(weekStart, 'MMM-dd'),
          income: data.income,
          expenditure: data.expenditure,
        }
      })
      .reduce(
        (acc, data) => {
          if (!acc[data.timestamp]) {
            acc[data.timestamp] = {
              timestamp: data.timestamp,
              income: 0,
              expenditure: 0,
            }
          }

          acc[data.timestamp].income += data.income
          acc[data.timestamp].expenditure += data.expenditure

          return acc
        },
        {} as {
          [key: string]: {
            timestamp: string
            income: number
            expenditure: number
          }
        },
      ),
  )
}

export function groupDataByMonth(dataArray: RevenueData[]) {
  return Object.values(
    dataArray
      .map((data) => {
        const date = parseISO(data.timestamp)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)

        return {
          timestamp: format(monthStart, 'MMM'),
          income: data.income,
          expenditure: data.expenditure,
        }
      })
      .reduce(
        (acc, data) => {
          if (!acc[data.timestamp]) {
            acc[data.timestamp] = {
              timestamp: data.timestamp,
              income: 0,
              expenditure: 0,
            }
          }

          acc[data.timestamp].income += data.income
          acc[data.timestamp].expenditure += data.expenditure

          return acc
        },
        {} as {
          [key: string]: {
            timestamp: string
            income: number
            expenditure: number
          }
        },
      ),
  )
}

export function groupDataByYear(dataArray: RevenueData[]) {
  return Object.values(
    dataArray
      .map((data) => {
        const date = parseISO(data.timestamp)
        const yearStart = new Date(date.getFullYear(), 0, 1)

        return {
          timestamp: format(yearStart, 'yyyy'),
          income: data.income,
          expenditure: data.expenditure,
        }
      })
      .reduce(
        (acc, data) => {
          if (!acc[data.timestamp]) {
            acc[data.timestamp] = {
              timestamp: data.timestamp,
              income: 0,
              expenditure: 0,
            }
          }

          acc[data.timestamp].income += data.income
          acc[data.timestamp].expenditure += data.expenditure

          return acc
        },
        {} as {
          [key: string]: {
            timestamp: string
            income: number
            expenditure: number
          }
        },
      ),
  )
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return value.toString()
}

export function mapToRevenueData({
  income,
  kitchenLedger,
  bakeryLedger,
}: {
  income: ProcessedOrder[]
  kitchenLedger: KitchenLedgerItem[]
  bakeryLedger: BakeryLedgerItem[]
}): RevenueData[] {
  const dataMap = new Map<string, RevenueData>()

  const push = (timestamp: string, incomeDelta = 0, expenditureDelta = 0) => {
    if (!dataMap.has(timestamp)) {
      dataMap.set(timestamp, {
        timestamp: timestamp,
        income: 0,
        expenditure: 0,
      })
    }

    const entry = dataMap.get(timestamp)!
    entry.income += incomeDelta
    entry.expenditure += expenditureDelta
  }

  for (const order of income) {
    const date = order.receiptDate
    const orderIncome = order.items.reduce(
      (acc, item) => acc + item.foodPrice * item.qty,
      0,
    )
    push(date, orderIncome, 0)
  }

  for (const item of kitchenLedger) {
    if (item.addedAt) push(item.addedAt, 0, item.price)
  }

  for (const item of bakeryLedger) {
    if (item.addedAt) push(item.addedAt, 0, item.price)
  }

  return Array.from(dataMap.values()).sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  )
}

export function groupRevenueData(revenueData: RevenueData[]): RevenueData[] {
  if (revenueData.length < 1) return revenueData

  const first = parseISO(revenueData[0].timestamp)
  const last = parseISO(revenueData[revenueData.length - 1].timestamp)
  const days = Math.abs(differenceInDays(last, first))

  if (format(first, 'yyyy-MM-dd') === format(last, 'yyyy-MM-dd')) {
    return groupDataByHour(revenueData)
  } else if (days <= 30) {
    return groupDataByDay(revenueData)
  } else {
    return groupDataByMonth(revenueData)
  }
}
