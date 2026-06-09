import { BarChart3, Boxes, LayoutDashboard, Plus, ShoppingCart, Users } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet.jsx'
import { cn } from '../../lib/utils.js'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

const QUICK = [
  { to: '/orders/new', label: 'New order', icon: Plus },
]

const REPORTS = [
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

function NavItem({ to, label, icon: Icon, end, disabled }) {
  if (disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60"
        title="Coming soon"
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
        <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">soon</span>
      </span>
    )
  }
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'border-l-2',
          isActive
            ? 'bg-accent text-accent-foreground border-primary'
            : 'border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/symbol.svg" alt="" className="h-7 w-7 text-primary" />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">Stocky</div>
            <div className="text-[11px] text-muted-foreground">Inventory · Orders</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div className="space-y-1">
          {NAV.map((it) => <NavItem key={it.to + it.label} {...it} />)}
        </div>
        <div>
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick</div>
          <div className="space-y-1">
            {QUICK.map((it) => <NavItem key={it.to + it.label} {...it} />)}
          </div>
        </div>
        <div>
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reports</div>
          <div className="space-y-1">
            {REPORTS.map((it) => <NavItem key={it.to + it.label} {...it} />)}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        <div>v1.0.0 · Demo</div>
        <div className="mt-1">Built with FastAPI + React</div>
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
