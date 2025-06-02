import { createFileRoute } from '@tanstack/react-router'
import { getAllOrders } from '@/firebase/firestore'
import { queryOptions } from '@tanstack/react-query'

export const Route = createFileRoute('/home/billing')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(getAllOrdersQueryOptions()),
})

export const getAllOrdersQueryOptions = () =>
  queryOptions({
    queryKey: ['getAllOrders'],
    queryFn: getAllOrders,
    placeholderData: [],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
