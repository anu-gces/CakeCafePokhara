import {
  getBakeryLedgerInRange,
  getKitchenLedgerInRange,
  getOrdersInRange,
} from '@/firebase/firestore'
import { queryOptions } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

export type Tab = 'overview' | 'analytics' | 'reports' | 'notifications'

type Search = {
  tab?: Tab
  from?: string
  to?: string
}

export const Route = createFileRoute('/home/dashboard')({
  beforeLoad: ({ context: { authentication } }) => {
    // Wait for authentication to be ready if needed

    const userAdditional = authentication.userAdditional
    if (
      userAdditional &&
      userAdditional.role !== 'admin' &&
      userAdditional.role !== 'owner'
    ) {
      throw redirect({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    }
  },
  validateSearch: (search: Record<string, unknown>): Search => {
    const validTabs: Tab[] = [
      'overview',
      'analytics',
      'reports',
      'notifications',
    ]
    const tab = validTabs.includes((search.tab as string)?.toLowerCase() as Tab)
      ? ((search.tab as string).toLowerCase() as Tab)
      : 'overview'

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    // Use local date string (not UTC ISO)
    function getLocalDateString(date: Date) {
      return date.toLocaleDateString('en-CA') // "YYYY-MM-DD"
    }

    const defaultFromDate = new Date()
    const defaultToDate = new Date()
    const from =
      typeof search.from === 'string' && dateRegex.test(search.from)
        ? search.from
        : getLocalDateString(defaultFromDate)
    const to =
      typeof search.to === 'string' && dateRegex.test(search.to)
        ? search.to
        : getLocalDateString(defaultToDate)

    return {
      tab: tab,
      from: from,
      to: to,
    }
  },

  loaderDeps: ({ search: { from, to } }) => ({ from, to }),
  loader: async ({ deps: { from, to }, context: { queryClient } }) => {
    const [income, kitchenLedger, bakeryLedger] = await Promise.all([
      queryClient.ensureQueryData(
        dashboardQueryIncomeOptions({ from: from!, to: to! }),
      ),
      queryClient.ensureQueryData(
        dashboardQueryKitchenLedgerOptions({ from: from!, to: to! }),
      ),
      queryClient.ensureQueryData(
        dashboardQueryBakeryLedgerOptions({ from: from!, to: to! }),
      ),
    ])
    const filteredIncome = income.filter(
      (order) => !order.complementary && order.status === 'paid',
    )
    return { income: filteredIncome, kitchenLedger, bakeryLedger }
  },
})

const dashboardQueryIncomeOptions = ({
  from,
  to,
}: {
  from: string
  to: string
}) =>
  queryOptions({
    queryKey: ['orderHistoryDashboard', from, to],
    queryFn: () => getOrdersInRange(from, to),
    placeholderData: [
      {
        receiptId: '',
        receiptDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        kotNumber: '',
        processedBy: '',
        discountRate: 0,
        taxRate: 0,
        tableNumber: -1,
        remarks: '',
        paymentMethod: 'cash',
        manualRounding: 0,
        complementary: false,
        items: [],
        status: 'pending',
        dismissed: false,
      },
    ],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

const dashboardQueryKitchenLedgerOptions = ({
  from,
  to,
}: {
  from: string
  to: string
}) =>
  queryOptions({
    queryKey: ['kitchenLedgerDashboard', from, to],
    queryFn: () => getKitchenLedgerInRange(from, to), // Replace with getKitchenLedgerInRange if available
    placeholderData: [
      {
        id: '',
        itemName: '',
        quantity: 0,
        unit: '',
        paymentStatus: 'paid',
        price: 0,
        notes: '',
        addedBy: '',
        addedAt: '',
      },
    ],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

const dashboardQueryBakeryLedgerOptions = ({
  from,
  to,
}: {
  from: string
  to: string
}) =>
  queryOptions({
    queryKey: ['bakeryLedgerDashboard', from, to],
    queryFn: () => getBakeryLedgerInRange(from, to), // Replace with getKitchenLedgerInRange if available
    placeholderData: [
      {
        id: '',
        itemName: '',
        quantity: 0,
        unit: '',
        paymentStatus: 'paid',
        price: 0,
        notes: '',
        addedBy: '',
        addedAt: '',
      },
    ],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
