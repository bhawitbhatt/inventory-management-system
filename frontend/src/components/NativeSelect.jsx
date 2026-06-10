import { ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils.js'

/**
 * Lightweight native `<select>` styled to match shadcn `<Input>`.
 *
 * Why native over shadcn `Select`:
 *   - register() drop-in for react-hook-form (no Controller boilerplate)
 *   - better mobile UX (uses the system picker)
 *   - same focus ring + bg/border tokens as Input for visual consistency
 */
export const NativeSelect = forwardRef(function NativeSelect(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
})
