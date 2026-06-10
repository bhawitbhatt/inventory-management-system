import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState } from '../components/ErrorState.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx'
import { useOrder } from '../hooks/use-orders.js'
import { formatCurrency, formatDateTime } from '../lib/format.js'
import { ROUTES } from '../lib/routes.js'

const STATUS_VARIANT = {
  confirmed: 'success',
  pending: 'warn',
  cancelled: 'muted',
}

export default function OrderDetail() {
  const { id } = useParams()
  const orderId = Number(id)
  const orderQ = useOrder(Number.isFinite(orderId) ? orderId : null)

  if (orderQ.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (orderQ.error || !orderQ.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.orders.list}>
            <ArrowLeft className="h-4 w-4" />
            All orders
          </Link>
        </Button>
        <ErrorState
          title="Couldn’t load order"
          description={orderQ.error?.message ?? 'Order not found.'}
          onRetry={() => orderQ.refetch()}
        />
      </div>
    )
  }

  const order = orderQ.data

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link to={ROUTES.orders.list}>
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
      </Button>

      <PageHeader
        title={`Order #${order.id}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <StatusBadge variant={STATUS_VARIANT[order.status] ?? 'muted'}>
            {order.status}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Items</CardTitle>
            <CardDescription className="text-xs">
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}{' '}
              · unit prices captured at order time
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">
                      {it.product?.name ?? `Product ${it.product_id}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {it.product?.sku ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(it.unit_price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {it.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(it.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold tabular-nums">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {order.customer ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Name
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {order.customer.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    {order.customer.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-0.5 tabular-nums text-foreground">
                    {order.customer.phone}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Customer #{order.customer_id}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
