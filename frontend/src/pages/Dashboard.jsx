import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Boxes, Plus, ShoppingCart, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { dashboardApi } from '../api/dashboard.js'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import StatCard from '../components/StatCard.jsx'
import { Badge } from '../components/ui/badge.jsx'
import { Button } from '../components/ui/button.jsx'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.jsx'
import { Skeleton } from '../components/ui/skeleton.jsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx'
import { formatCurrency } from '../lib/format.js'

function StatSkeleton() {
  return (
    <Card>
      <div className="p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground">
        <div className="font-medium text-destructive">Failed to load dashboard</div>
        <div className="mt-1 text-muted-foreground">{error.message}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening across your inventory today.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/orders/new">
            <Plus className="h-4 w-4" />
            New order
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total products" value={data.total_products} icon={Boxes} accent="brand" />
            <StatCard label="Total customers" value={data.total_customers} icon={Users} accent="green" />
            <StatCard label="Total orders" value={data.total_orders} icon={ShoppingCart} accent="slate" />
            <StatCard
              label="Low stock items"
              value={data.low_stock_products.length}
              icon={AlertTriangle}
              accent={data.low_stock_products.length > 0 ? 'amber' : 'green'}
              hint={`Below ${data.low_stock_threshold} units`}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Low stock alerts</CardTitle>
            <CardDescription className="text-xs">
              Products with quantity below {data?.low_stock_threshold ?? '—'} units.
            </CardDescription>
          </div>
          {data && data.low_stock_products.length > 0 && (
            <Badge variant="warn">{data.low_stock_products.length} need attention</Badge>
          )}
        </CardHeader>
        {isLoading || !data ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : data.low_stock_products.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="All stock levels are healthy"
              description="No products are currently below the low-stock threshold."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.low_stock_products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs tabular-nums">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="warn" className="font-mono tabular-nums">
                        {p.quantity_in_stock}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/products">Manage products</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/customers">Manage customers</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/orders">View orders</Link>
        </Button>
      </div>
    </div>
  )
}
