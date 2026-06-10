import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Boxes, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { dashboardApi } from '../api/dashboard.js'
import EmptyState from '../components/EmptyState.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { Button } from '../components/ui/button.jsx'
import {
  Card,
  CardContent,
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
import { useOrders } from '../hooks/use-orders.js'
import { useProduct } from '../hooks/use-products.js'
import { formatCurrency, formatDateTime } from '../lib/format.js'
import { dashboardKeys } from '../lib/query-keys.js'
import { ROUTES } from '../lib/routes.js'

function stockStatus(qty, threshold) {
  if (!Number.isFinite(qty)) return { label: 'Unknown', variant: 'muted' }
  if (qty === 0) return { label: 'Out of stock', variant: 'danger' }
  if (qty <= threshold) return { label: 'Low stock', variant: 'warn' }
  return { label: 'In stock', variant: 'success' }
}

export default function ProductDetail() {
  const { id } = useParams()
  const productId = Number(id)
  const valid = Number.isFinite(productId)

  const productQ = useProduct(valid ? productId : null)
  const ordersQ = useOrders()
  const dashboardQ = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: dashboardApi.get,
  })

  const threshold = dashboardQ.data?.low_stock_threshold ?? 10

  const relatedOrders = useMemo(() => {
    if (!Array.isArray(ordersQ.data) || !valid) return []
    return ordersQ.data
      .filter((o) => o.items?.some((i) => i.product_id === productId))
      .map((o) => {
        const lines = o.items.filter((i) => i.product_id === productId)
        const qty = lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0)
        const revenue = lines.reduce(
          (a, l) => a + (Number(l.line_total) || 0),
          0,
        )
        return { ...o, qty, revenue }
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf(),
      )
  }, [ordersQ.data, productId, valid])

  const totals = useMemo(() => {
    const unitsSold = relatedOrders.reduce((a, o) => a + o.qty, 0)
    const revenue = relatedOrders.reduce((a, o) => a + o.revenue, 0)
    return { unitsSold, revenue }
  }, [relatedOrders])

  if (!valid) {
    return (
      <ErrorState
        title="Invalid product id"
        description="The URL is malformed. Pick a product from the catalog."
      />
    )
  }

  if (productQ.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (productQ.error || !productQ.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.products.list}>
            <ArrowLeft className="h-4 w-4" />
            All products
          </Link>
        </Button>
        <ErrorState
          title="Couldn’t load product"
          description={productQ.error?.message ?? 'Product not found.'}
          onRetry={() => productQ.refetch()}
        />
      </div>
    )
  }

  const product = productQ.data
  const status = stockStatus(product.quantity_in_stock, threshold)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.products.list}>
            <ArrowLeft className="h-4 w-4" />
            All products
          </Link>
        </Button>
        <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
      </div>

      <Card>
        <CardHeader>
          <CardDescription className="font-mono text-xs uppercase tracking-wide">
            SKU · {product.sku}
          </CardDescription>
          <CardTitle className="text-2xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Price
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(product.price)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                In stock
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {product.quantity_in_stock}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Units sold
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {totals.unitsSold}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Revenue
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(totals.revenue)}
              </dd>
            </div>
          </dl>
          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1 text-foreground">
                {formatDateTime(product.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Updated
              </dt>
              <dd className="mt-1 text-foreground">
                {formatDateTime(product.updated_at)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">
              Recent orders
            </CardTitle>
            <CardDescription className="text-xs">
              Orders that included this product, newest first.
            </CardDescription>
          </div>
          {relatedOrders.length > 0 ? (
            <StatusBadge variant="muted">
              {relatedOrders.length} order
              {relatedOrders.length === 1 ? '' : 's'}
            </StatusBadge>
          ) : null}
        </CardHeader>
        {ordersQ.isLoading ? (
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        ) : relatedOrders.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="This product hasn’t appeared on any orders."
            />
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        to={ROUTES.orders.detail(o.id)}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        #{o.id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {o.customer?.full_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.qty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(o.revenue)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(o.created_at)}
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
          <Link to={ROUTES.orders.new}>
            <Boxes className="h-4 w-4" />
            New order with this product
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`${ROUTES.products.list}?filter=low`}>
            View all low-stock
          </Link>
        </Button>
      </div>
    </div>
  )
}
