import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { dashboardApi } from '../api/dashboard.js'
import EmptyState from '../components/EmptyState.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
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
import { useOrders } from '../hooks/use-orders.js'
import { formatCurrency } from '../lib/format.js'
import { dashboardKeys } from '../lib/query-keys.js'
import { ROUTES } from '../lib/routes.js'

const SPARK_DAYS = 7

function greetingForHour(hour) {
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Aggregate orders into `days` buckets keyed by day-of-creation.
 * `valueFn(order)` returns the contribution of one order to its bucket.
 * Returns a fixed-length array (oldest first → today last) or `null` if
 * orders isn't a non-empty array.
 */
function bucketByDay(orders, valueFn, days = SPARK_DAYS) {
  if (!Array.isArray(orders) || orders.length === 0) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = Array.from({ length: days }, () => 0)
  for (const o of orders) {
    if (!o?.created_at) continue
    const d = new Date(o.created_at)
    if (Number.isNaN(d.valueOf())) continue
    d.setHours(0, 0, 0, 0)
    const diff = Math.floor((today.valueOf() - d.valueOf()) / 86_400_000)
    if (diff >= 0 && diff < days) buckets[days - 1 - diff] += valueFn(o)
  }
  return buckets
}

export default function Dashboard() {
  const navigate = useNavigate()
  const dashboardQ = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: dashboardApi.get,
  })
  const ordersQ = useOrders()

  const ordersSeries = useMemo(
    () => bucketByDay(ordersQ.data, () => 1, SPARK_DAYS),
    [ordersQ.data],
  )
  const revenueSeries = useMemo(
    () =>
      bucketByDay(
        ordersQ.data,
        (o) => Number(o.total_amount) || 0,
        SPARK_DAYS,
      ),
    [ordersQ.data],
  )
  const totalRevenue = useMemo(() => {
    if (!Array.isArray(ordersQ.data)) return 0
    return ordersQ.data.reduce(
      (a, o) => a + (Number(o.total_amount) || 0),
      0,
    )
  }, [ordersQ.data])

  const goToProduct = (id) => navigate(ROUTES.products.detail(id))

  if (dashboardQ.error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Today's overview."
        />
        <ErrorState
          title="Couldn’t load dashboard"
          description={dashboardQ.error.message}
          onRetry={() => dashboardQ.refetch()}
        />
      </div>
    )
  }

  const data = dashboardQ.data
  const isLoading = dashboardQ.isLoading || !data

  return (
    <div className="space-y-6">
      <PageHeader
        title={greetingForHour(new Date().getHours())}
        description="Here's what's happening across your inventory today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Total products"
              value={data.total_products}
              icon={Boxes}
              accent="brand"
              to={ROUTES.products.list}
            />
            <StatCard
              label="Total customers"
              value={data.total_customers}
              icon={Users}
              accent="green"
              to={ROUTES.customers}
            />
            <StatCard
              label="Total orders"
              value={data.total_orders}
              icon={ShoppingCart}
              accent="slate"
              to={ROUTES.orders.list}
              hint={`Last ${SPARK_DAYS} days`}
              series={ordersSeries}
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              accent="info"
              hint={`Last ${SPARK_DAYS} days`}
              series={revenueSeries}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">
              Low stock alerts
            </CardTitle>
            <CardDescription className="text-xs">
              Products with quantity below{' '}
              {data?.low_stock_threshold ?? '—'} units.
            </CardDescription>
          </div>
          {data && data.low_stock_products.length > 0 ? (
            <StatusBadge variant="warn">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {data.low_stock_products.length} need attention
            </StatusBadge>
          ) : null}
        </CardHeader>
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
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
                  <TableRow
                    key={p.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => goToProduct(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToProduct(p.id)
                      }
                    }}
                  >
                    <TableCell className="font-mono text-xs tabular-nums">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge
                        variant={p.quantity_in_stock === 0 ? 'danger' : 'warn'}
                      >
                        {p.quantity_in_stock}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
