import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { dashboardApi } from '../api/dashboard.js'
import { ordersApi } from '../api/orders.js'
import { productsApi } from '../api/products.js'
import EmptyState from '../components/EmptyState.jsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.jsx'
import { Skeleton } from '../components/ui/skeleton.jsx'
import { formatCurrency } from '../lib/format.js'

const TIMELINE_DAYS = 30

function dateKey(d) {
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function shortLabel(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function buildTimeline(orders, days = TIMELINE_DAYS) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = new Map()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    buckets.set(dateKey(d), { date: shortLabel(d), orders: 0, revenue: 0 })
  }
  if (!Array.isArray(orders)) return Array.from(buckets.values())
  for (const o of orders) {
    if (!o?.created_at) continue
    const d = new Date(o.created_at)
    if (Number.isNaN(d.valueOf())) continue
    d.setHours(0, 0, 0, 0)
    const key = dateKey(d)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.orders += 1
    bucket.revenue += Number(o.total_amount) || 0
  }
  return Array.from(buckets.values())
}

function buildStockDistribution(products, threshold) {
  let healthy = 0
  let low = 0
  let out = 0
  if (Array.isArray(products)) {
    for (const p of products) {
      const qty = Number(p.quantity_in_stock) || 0
      if (qty === 0) out += 1
      else if (qty <= threshold) low += 1
      else healthy += 1
    }
  }
  return [
    { name: 'Healthy', value: healthy, color: 'hsl(var(--success))' },
    { name: 'Low', value: low, color: 'hsl(var(--warn))' },
    { name: 'Out', value: out, color: 'hsl(var(--destructive))' },
  ]
}

function buildTopProducts(orders, products, n = 5) {
  if (!Array.isArray(orders) || !Array.isArray(products)) return []
  const productMap = new Map(products.map((p) => [p.id, p]))
  const revenueByProduct = new Map()
  for (const o of orders) {
    if (!Array.isArray(o.items)) continue
    for (const item of o.items) {
      const current = revenueByProduct.get(item.product_id) || 0
      revenueByProduct.set(item.product_id, current + (Number(item.line_total) || 0))
    }
  }
  return Array.from(revenueByProduct.entries())
    .map(([productId, revenue]) => {
      const product = productMap.get(productId)
      return {
        id: productId,
        name: product?.name?.length > 20 ? `${product.name.slice(0, 18)}…` : product?.name ?? `#${productId}`,
        revenue: Number(revenue.toFixed(2)),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n)
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="mb-1 font-medium text-foreground">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: entry.color ?? entry.fill ?? entry.stroke }}
            />
            <span className="capitalize">{entry.name}:</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartSkeleton({ height = 280 }) {
  return <Skeleton className="w-full" style={{ height }} />
}

export default function Analytics() {
  const ordersQ = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const productsQ = useQuery({ queryKey: ['products'], queryFn: productsApi.list })
  const dashboardQ = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get })

  const threshold = dashboardQ.data?.low_stock_threshold ?? 10

  const timeline = useMemo(() => buildTimeline(ordersQ.data, TIMELINE_DAYS), [ordersQ.data])
  const distribution = useMemo(
    () => buildStockDistribution(productsQ.data, threshold),
    [productsQ.data, threshold],
  )
  const top = useMemo(
    () => buildTopProducts(ordersQ.data, productsQ.data, 5),
    [ordersQ.data, productsQ.data],
  )

  const totalOrders = timeline.reduce((a, b) => a + b.orders, 0)
  const totalRevenue = timeline.reduce((a, b) => a + b.revenue, 0)
  const totalProducts = distribution.reduce((a, b) => a + b.value, 0)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inventory and orders activity from the last {TIMELINE_DAYS} days.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Orders &amp; revenue</CardTitle>
            <CardDescription className="text-xs">
              Daily order volume and revenue trend.
            </CardDescription>
          </div>
          <div className="text-right text-xs">
            <div className="font-medium tabular-nums text-foreground">
              {totalOrders} orders · {formatCurrency(totalRevenue)}
            </div>
            <div className="text-muted-foreground">last {TIMELINE_DAYS} days</div>
          </div>
        </CardHeader>
        <CardContent>
          {ordersQ.isLoading ? (
            <ChartSkeleton height={280} />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#ordersFill)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Stock health</CardTitle>
            <CardDescription className="text-xs">
              Distribution of products by stock status (threshold: {threshold}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsQ.isLoading ? (
              <ChartSkeleton height={260} />
            ) : totalProducts === 0 ? (
              <EmptyState
                title="No products yet"
                description="Add products to see stock health."
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      stroke="hsl(var(--background))"
                    >
                      {distribution.map((segment) => (
                        <Cell key={segment.name} fill={segment.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top 5 products by revenue</CardTitle>
            <CardDescription className="text-xs">
              Aggregated from all orders. Hover for exact amounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersQ.isLoading || productsQ.isLoading ? (
              <ChartSkeleton height={260} />
            ) : top.length === 0 ? (
              <EmptyState
                title="No revenue yet"
                description="Create orders to see top performers."
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={top}
                    margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={130}
                    />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
