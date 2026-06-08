import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { dashboardApi } from '../api/dashboard.js'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import StatCard from '../components/StatCard.jsx'
import { formatCurrency } from '../lib/format.js'

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  if (isLoading) return <Spinner />

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 p-5 text-sm text-red-800">
        Failed to load dashboard: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of products, customers, and orders.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total products" value={data.total_products} accent="brand" />
        <StatCard label="Total customers" value={data.total_customers} accent="green" />
        <StatCard label="Total orders" value={data.total_orders} accent="slate" />
        <StatCard
          label="Low stock products"
          value={data.low_stock_products.length}
          hint={`Below ${data.low_stock_threshold} units`}
          accent="amber"
        />
      </div>

      <section className="card">
        <header className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Low stock alerts</h2>
          <p className="text-xs text-slate-500">
            Products with quantity below {data.low_stock_threshold}.
          </p>
        </header>
        {data.low_stock_products.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="All stock levels are healthy"
              description="No products are currently below the low-stock threshold."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">In stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td className="table-td font-mono text-xs">{p.sku}</td>
                    <td className="table-td">{p.name}</td>
                    <td className="table-td">{formatCurrency(p.price)}</td>
                    <td className="table-td">
                      <span className="badge bg-amber-50 text-amber-700">
                        {p.quantity_in_stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/products" className="btn-secondary">
          Manage products
        </Link>
        <Link to="/orders/new" className="btn-primary">
          New order
        </Link>
      </div>
    </div>
  )
}
