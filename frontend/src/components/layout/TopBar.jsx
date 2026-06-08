import { Bell, Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={onOpenSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo (mobile-only — sidebar shows it on desktop) */}
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <img src="/symbol.svg" alt="" className="h-6 w-6 text-primary" />
        <span className="text-base font-semibold tracking-tight">Stocky</span>
      </Link>

      {/* Breadcrumbs (hidden on small) */}
      <div className="hidden flex-1 sm:flex">
        <Breadcrumbs />
      </div>
      <div className="flex-1 sm:hidden" />

      {/* Cmd+K trigger */}
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 gap-2 px-3 text-muted-foreground md:flex"
        onClick={onOpenCommand}
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={onOpenCommand}>
        <Search className="h-4 w-4" />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="User menu">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">Demo user</span>
              <span className="text-xs text-muted-foreground">Demo mode</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Settings (coming soon)</DropdownMenuItem>
          <DropdownMenuItem disabled>API tokens (coming soon)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/docs" target="_blank" rel="noreferrer">API docs ↗</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
