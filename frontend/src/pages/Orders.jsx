import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import { ordersApi } from '../api/orders.js'
import { extractError } from '../api/client.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import { formatCurrency, formatDateTime } from '../lib/format.js'

export default function Orders() {
  const qc = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  })

  const [confirmDelete, setConfirmDelete] = useState(null)

  const deleteMut = useMutation({
    mutationFn: ordersApi.remove,
    onSuccess: () => {
      toast.success('Order cancelled — stock restored')
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setConfirmDelete(null)
    },
    onError: (e) => {
      toast.error(extractError(e))
      setConfirmDelete(null)
    },
  })

  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 p-5 text-sm text-red-800">
        Failed to load orders: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and review customer orders. Stock is decremented automatically on confirmation.
          </p>
        </div>
        <Link to="/orders/new" className="btn-primary">
          + New order
        </Link>
      </header>

      {data.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Create your first order to see it here."
          action={
            <Link to="/orders/new" className="btn-primary">
              Create order
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Order #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Items</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((o) => (
                <tr key={o.id}>
                  <td className="table-td font-mono text-xs">
                    <Link
                      to={`/orders/${o.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      #{o.id}
                    </Link>
                  </td>
                  <td className="table-td font-medium text-slate-900">
                    {o.customer?.full_name ?? `Customer ${o.customer_id}`}
                  </td>
                  <td className="table-td">{o.items.length}</td>
                  <td className="table-td font-semibold">{formatCurrency(o.total_amount)}</td>
                  <td className="table-td">
                    <span className="badge bg-emerald-50 text-emerald-700">{o.status}</span>
                  </td>
                  <td className="table-td text-slate-500">{formatDateTime(o.created_at)}</td>
                  <td className="table-td text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/orders/${o.id}`} className="btn-ghost px-2 py-1 text-xs">
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(o)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Cancel order?"
        message={
          confirmDelete
            ? `This will cancel order #${confirmDelete.id} and restore stock to inventory.`
            : ''
        }
        confirmLabel="Cancel order"
        danger
        busy={deleteMut.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => deleteMut.mutate(confirmDelete.id)}
      />
    </div>
  )
}
