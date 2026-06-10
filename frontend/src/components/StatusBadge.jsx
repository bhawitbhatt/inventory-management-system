import { cn } from '../lib/utils.js'

const VARIANTS = {
  default: 'bg-muted text-muted-foreground border-border',
  muted: 'bg-muted text-muted-foreground border-border',
  success: 'bg-success/15 text-success border-success/30',
  warn: 'bg-warn/15 text-warn border-warn/30',
  info: 'bg-info/15 text-info border-info/30',
  danger: 'bg-destructive/15 text-destructive border-destructive/30',
}

/**
 * Token-driven semantic badge.
 *
 * Replaces hardcoded amber/emerald inline badges with a single component
 * that pulls its color from semantic CSS variables (`--success`, `--warn`,
 * `--info`, `--destructive`) so light + dark modes stay coherent.
 *
 * @param {object} props
 * @param {'default'|'success'|'warn'|'info'|'danger'|'muted'} [props.variant='default']
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export function StatusBadge({
  variant = 'default',
  children,
  className,
  ...rest
}) {
  const variantClass = VARIANTS[variant] ?? VARIANTS.default
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClass,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
