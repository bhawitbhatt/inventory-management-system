import { AlertCircle } from 'lucide-react'

import { cn } from '../lib/utils.js'
import { Button } from './ui/button.jsx'
import { Card } from './ui/card.jsx'

/**
 * Inline error banner — replaces the 5× duplicated red <div> with an
 * accessible Card variant. Pass `onRetry` to surface a retry button.
 *
 * @param {object} props
 * @param {string} [props.title='Something went wrong']
 * @param {string} [props.description]
 * @param {() => void} [props.onRetry]
 * @param {string} [props.className]
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}) {
  return (
    <Card
      role="alert"
      aria-live="polite"
      className={cn(
        'border-destructive/30 bg-destructive/5 p-5 shadow-none',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-destructive">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
