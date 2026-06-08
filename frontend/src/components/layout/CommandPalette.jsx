import {
  Boxes,
  LayoutDashboard,
  Moon,
  Plus,
  ShoppingCart,
  Sun,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '../ui/command.jsx'
import { useTheme } from '../theme-provider.jsx'

export function useCommandPaletteShortcut(setOpen) {
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setOpen])
}

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { setTheme } = useTheme()

  const go = (path) => {
    navigate(path)
    onOpenChange(false)
  }
  const theme = (mode) => {
    setTheme(mode)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search products, customers, orders, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/')}>
            <LayoutDashboard />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/products')}>
            <Boxes />
            <span>Products</span>
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/customers')}>
            <Users />
            <span>Customers</span>
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/orders')}>
            <ShoppingCart />
            <span>Orders</span>
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go('/orders/new')}>
            <Plus />
            <span>New order</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => theme('light')}>
            <Sun />
            <span>Light mode</span>
          </CommandItem>
          <CommandItem onSelect={() => theme('dark')}>
            <Moon />
            <span>Dark mode</span>
          </CommandItem>
          <CommandItem onSelect={() => theme('system')}>
            <span className="h-4 w-4" />
            <span>System theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
