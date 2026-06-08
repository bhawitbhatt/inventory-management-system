import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { ordersApi } from '../api/orders.js'
import Spinner from '../components/Spinner.jsx'
import { formatCurrency, formatDateTime } from '../lib/format.js'

export default function OrderDetail() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(id),
  })

  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
          Failed to load order: {error.message}
        </div>
        <Link to="/orders" className="btn-secondary">
          ← Back to orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            #{data.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(data.created_at)}
          </p>
        </div>
        <Link to="/orders" className="btn-secondary">
          ← All orders
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="card p-5 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Unit price</th>
                  <th className="table-th">Quantity</th>
                  <th className="table-th text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {data.items.map((it) => (
                  <tr key={it.id}>
                    <td className="table-td font-medium text-foreground">
                      {it.product?.name ?? `Product ${it.product_id}`}
                    </td>
                    <td className="table-td font-mono text-xs">
                      {it.product?.sku ?? '—'}
                    </td>
                    <td className="table-td">{formatCurrency(it.unit_price)}</td>
                    <td className="table-td">{it.quantity}</td>
                    <td className="table-td text-right font-semibold">
                      {formatCurrency(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted">
                <tr>
                  <td className="table-td font-semibold" colSpan={4}>
                    Total
                  </td>
                  <td className="table-td text-right text-lg font-bold">
                    {formatCurrency(data.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Customer</h2>
          {data.customer ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{data.customer.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd className="text-foreground">{data.customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
                <dd className="text-foreground">{data.customer.phone}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Customer #{data.customer_id}</p>
          )}
          <hr className="my-4 border-border" />
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
          <p>
            <span className="badge mt-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{data.status}</span>
          </p>
        </section>
      </div>
    </div>
  )
}
