import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

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

export default function StatCard({ label, value, hint, accent = 'brand', delta, icon: Icon }) {
  const trendIcon =
    delta == null ? null : delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus
  const trendClass =
    delta == null
      ? 'text-muted-foreground'
      : delta > 0
        ? 'text-success'
        : delta < 0
          ? 'text-destructive'
          : 'text-muted-foreground'

  return (
    <Card className="transition-colors hover:bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accentClasses[accent] || accentClasses.brand)}>
          {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value ?? '—'}</div>
          {trendIcon && (
            <div className={cn('flex items-center gap-0.5 text-xs font-medium', trendClass)}>
              {(() => {
                const Trend = trendIcon
                return <Trend className="h-3 w-3" aria-hidden />
              })()}
              <span>{Math.abs(delta).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {hint && <CardDescription className="mt-1 text-xs">{hint}</CardDescription>}
      </CardContent>
    </Card>
  )
}
