import { cn } from '../lib/utils.js'

/**
 * Reusable page header — title + optional description + right-aligned action slot.
 * Replaces the 6× duplicated `<header class="flex flex-wrap items-end...">` pattern
 * that previously appeared at the top of every page.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.className]
 */
export function PageHeader({ title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 pb-2',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
