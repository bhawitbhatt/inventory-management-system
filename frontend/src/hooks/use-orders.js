/**
 * Order data hooks — queries + mutations with toast + cache invalidation.
 *
 * Backend does NOT expose PUT /orders; status mutations would need a new
 * endpoint, so no useUpdateOrder is provided here.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { extractError } from '../api/client.js'
import { ordersApi } from '../api/orders.js'
import { dashboardKeys, orderKeys, productKeys } from '../lib/query-keys.js'

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: ordersApi.list,
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: id != null,
  })
}

function useInvalidateOrderData() {
  const qc = useQueryClient()
  return () => {
    // Order mutations affect stock, so we also invalidate products + dashboard.
    qc.invalidateQueries({ queryKey: orderKeys.all })
    qc.invalidateQueries({ queryKey: productKeys.all })
    qc.invalidateQueries({ queryKey: dashboardKeys.all })
  }
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrderData()
  return useMutation({
    mutationFn: (payload) => ordersApi.create(payload),
    onSuccess: () => {
      toast.success('Order placed')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}

export function useDeleteOrder() {
  const invalidate = useInvalidateOrderData()
  return useMutation({
    mutationFn: (id) => ordersApi.remove(id),
    onSuccess: () => {
      toast.success('Order cancelled')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}
