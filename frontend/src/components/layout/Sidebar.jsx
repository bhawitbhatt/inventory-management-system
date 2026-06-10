import { Link, NavLink } from 'react-router-dom'

import { cn } from '../../lib/utils.js'
import { NAV_GROUPS, ROUTES } from '../../lib/routes.js'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet.jsx'

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'border-primary bg-brand-50 text-brand-900 dark:bg-brand-50 dark:text-brand-900'
            : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  )
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <Link
          to={ROUTES.dashboard}
          className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src="/symbol.svg"
            alt=""
            className="h-7 w-7 text-primary"
            aria-hidden="true"
          />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-foreground">
              Stocky
            </div>
            <div className="text-[11px] text-muted-foreground">
              Inventory · Orders
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Main">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`}>
            {group.label ? (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-1">
              {group.items.map((it) => (
                <NavItem
                  key={it.path}
                  to={it.path}
                  end={it.exact}
                  label={it.label}
                  icon={it.icon}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4 text-[11px] text-muted-foreground">
        <p>Built with FastAPI, React, and PostgreSQL.</p>
      </div>
    </div>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}
