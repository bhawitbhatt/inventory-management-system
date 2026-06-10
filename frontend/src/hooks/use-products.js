/**
 * Product data hooks — queries + mutations with toast + cache invalidation.
 *
 * Every page that touches products should consume these instead of calling
 * `useQuery`/`useMutation` directly with hand-typed query keys.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { extractError } from '../api/client.js'
import { productsApi } from '../api/products.js'
import { dashboardKeys, productKeys } from '../lib/query-keys.js'

export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: productsApi.list,
  })
}

export function useProduct(id) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.get(id),
    enabled: id != null,
  })
}

function useInvalidateProductData() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: productKeys.all })
    qc.invalidateQueries({ queryKey: dashboardKeys.all })
  }
}

export function useCreateProduct() {
  const invalidate = useInvalidateProductData()
  return useMutation({
    mutationFn: (payload) => productsApi.create(payload),
    onSuccess: () => {
      toast.success('Product created')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProductData()
  return useMutation({
    mutationFn: ({ id, payload }) => productsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Product updated')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProductData()
  return useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      toast.success('Product deleted')
      invalidate()
    },
    onError: (err) => toast.error(extractError(err)),
  })
}
