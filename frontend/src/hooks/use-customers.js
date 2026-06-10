/**
 * Customer data hooks — queries + mutations with toast + cache invalidation.
 *
 * Backend exposes PUT /customers/{id}, so useUpdateCustomer is wired up.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { extractError } from '../api/client.js'
import { customersApi } from '../api/customers.js'
import { customerKeys, dashboardKeys } from '../lib/query-keys.js'

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: customersApi.list,
  })
}

export function useCustomer(id) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: id != null,
  })
}

function useInvalidateCustomerData() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: customerKeys.all })
    qc.invalidateQueries({ queryKey: dashboardKeys.all })
  }
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomerData()
  return useMutation({
    mutationFn: (payload) => customersApi.create(payload),
    onSuccess: () => {
      toast.success('Customer added')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomerData()
  return useMutation({
    mutationFn: ({ id, payload }) => customersApi.update(id, payload),
    onSuccess: () => {
      toast.success('Customer updated')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}

export function useDeleteCustomer() {
  const invalidate = useInvalidateCustomerData()
  return useMutation({
    mutationFn: (id) => customersApi.remove(id),
    onSuccess: () => {
      toast.success('Customer removed')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}
