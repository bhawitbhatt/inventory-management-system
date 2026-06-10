import { cn } from '../../lib/utils.js'

/**
 * Animated placeholder block. The shimmer animation uses an animated background
 * gradient (defined in tailwind.config.js as the `shimmer` keyframe), which is
 * less jarring than the default `animate-pulse` opacity fade and matches the
 * Inter/JetBrains-Mono visual register we've established elsewhere.
 *
 * Honors `prefers-reduced-motion` by falling back to a static muted block.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted',
        'bg-[linear-gradient(110deg,hsl(var(--muted))_25%,hsl(var(--foreground)/0.06)_50%,hsl(var(--muted))_75%)]',
        'bg-[length:200%_100%] animate-shimmer',
        'motion-reduce:animate-none motion-reduce:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
