import { Inbox } from 'lucide-react'

import { cn } from '../lib/utils.js'

export default function EmptyState({ title, description, action, icon: Icon = Inbox, className }) {
  return (
    <div className={cn('rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center', className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-balance">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
