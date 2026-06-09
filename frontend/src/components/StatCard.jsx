import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx'
import { cn } from '../lib/utils.js'

const accentClasses = {
  brand: 'bg-primary/10 text-primary',
  amber: 'bg-warn/15 text-warn',
  green: 'bg-success/15 text-success',
  slate: 'bg-muted text-muted-foreground',
  rose: 'bg-destructive/15 text-destructive',
  info: 'bg-info/15 text-info',
}

const sparkColors = {
  brand: 'hsl(var(--primary))',
  amber: 'hsl(var(--warn))',
  green: 'hsl(var(--success))',
  slate: 'hsl(var(--muted-foreground))',
  rose: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
}

function AnimatedNumber({ value }) {
  const numeric = typeof value === 'number' ? value : Number(value)
  const safe = Number.isFinite(numeric) ? numeric : 0
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration: 800, bounce: 0 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    mv.set(safe)
  }, [mv, safe])

  if (value === undefined || value === null) {
    return <span>—</span>
  }
  if (!Number.isFinite(numeric)) {
    return <span>{value}</span>
  }
  return <motion.span>{display}</motion.span>
}

export default function StatCard({
  label,
  value,
  hint,
  accent = 'brand',
  delta,
  icon: Icon,
  to,
  series,
}) {
  const trendIcon =
    delta === undefined || delta === null
      ? null
      : delta > 0
        ? ArrowUp
        : delta < 0
          ? ArrowDown
          : Minus
  const trendClass =
    delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'

  const hasSeries = Array.isArray(series) && series.length > 1
  const sparkData = hasSeries ? series.map((v, i) => ({ i, v: Number(v) || 0 })) : null
  const sparkId = `spark-${accent}-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'x'}`
  const stroke = sparkColors[accent] ?? sparkColors.brand

  const inner = (
    <Card
      className={cn(
        'transition-colors hover:bg-card/80 h-full',
        to && 'cursor-pointer hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/40',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <span
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md',
              accentClasses[accent] ?? accentClasses.brand,
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            <AnimatedNumber value={value} />
          </div>
          {trendIcon && (
            <span className={cn('inline-flex items-center gap-0.5 text-xs', trendClass)}>
              {(() => {
                const TrendIcon = trendIcon
                return <TrendIcon className="h-3 w-3" />
              })()}
              <span className="tabular-nums">{Math.abs(delta)}</span>
            </span>
          )}
        </div>
        {hint && <CardDescription className="mt-1 text-xs">{hint}</CardDescription>}
        {hasSeries && (
          <div className="mt-3 h-10 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={stroke}
                  strokeWidth={1.5}
                  fill={`url(#${sparkId})`}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="block rounded-lg outline-none">
        {inner}
      </Link>
    )
  }
  return inner
}
