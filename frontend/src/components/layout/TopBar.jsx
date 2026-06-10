import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Bell, Boxes, Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { dashboardApi } from '../../api/dashboard.js'
import { dashboardKeys } from '../../lib/query-keys.js'
import { ROUTES } from '../../lib/routes.js'
import { Avatar, AvatarFallback } from '../ui/avatar.jsx'
import { Button } from '../ui/button.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.jsx'
import { ThemeToggle } from '../theme-toggle.jsx'
import { Breadcrumbs } from './Breadcrumbs.jsx'

export function TopBar({ onOpenSidebar, onOpenCommand }) {
  const dashboardQ = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: dashboardApi.get,
  })
  const lowStock = dashboardQ.data?.low_stock_products ?? []
  const hasAlerts = lowStock.length > 0

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Brand (mobile-only — desktop has it in the sidebar) */}
      <Link
        to={ROUTES.dashboard}
        className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <img src="/symbol.svg" alt="" className="h-6 w-6" aria-hidden="true" />
        <span className="text-base font-semibold tracking-tight">Stocky</span>
      </Link>

      {/* Breadcrumbs */}
      <div className="hidden flex-1 sm:flex">
        <Breadcrumbs />
      </div>
      <div className="flex-1 sm:hidden" />

      {/* Cmd+K trigger */}
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 gap-2 px-3 text-muted-foreground hover:bg-brand-50 md:flex"
        onClick={onOpenCommand}
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={onOpenCommand}
      >
        <Search className="h-4 w-4" />
      </Button>

      <ThemeToggle />

      {/* Notifications — surfaces real low-stock alerts */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              hasAlerts
                ? `Notifications: ${lowStock.length} low-stock alert${lowStock.length === 1 ? '' : 's'}`
                : 'Notifications'
            }
          >
            <Bell className="h-4 w-4" />
            {hasAlerts ? (
              <span
                className="absolute right-1.5 top-1.5 inline-flex h-2 w-2 rounded-full bg-warn ring-2 ring-background"
                aria-hidden="true"
              />
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Notifications</span>
            {hasAlerts ? (
              <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-medium text-warn">
                {lowStock.length}
              </span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!hasAlerts ? (
            <DropdownMenuItem disabled>
              All stock levels are healthy.
            </DropdownMenuItem>
          ) : (
            <>
              {lowStock.slice(0, 5).map((p) => (
                <DropdownMenuItem key={p.id} asChild>
                  <Link
                    to={ROUTES.products.detail(p.id)}
                    className="flex items-start gap-2"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                    <span className="flex-1">
                      <span className="block font-medium text-foreground">
                        {p.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {p.sku} · only {p.quantity_in_stock} left
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to={`${ROUTES.products.list}?filter=low`}
                  className="text-sm font-medium text-primary"
                >
                  View all low-stock products →
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Brand-mark avatar — no PII, no demo-tier labels */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand-100 text-brand-900 dark:bg-brand-100 dark:text-brand-900">
                <Boxes className="h-4 w-4" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">Stocky</span>
              <span className="text-xs text-muted-foreground">
                Inventory & order management
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/docs" target="_blank" rel="noreferrer">
              API documentation ↗
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub ↗
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
