import { Moon, Plus, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { NAV_ITEMS, ROUTES } from '../../lib/routes.js'
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
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
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
  const pickTheme = (mode) => {
    setTheme(mode)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search products, customers, orders, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.path}
                onSelect={() => go(item.path)}
              >
                <Icon />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(ROUTES.orders.new)}>
            <Plus />
            <span>New order</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => pickTheme('light')}>
            <Sun />
            <span>Light mode</span>
          </CommandItem>
          <CommandItem onSelect={() => pickTheme('dark')}>
            <Moon />
            <span>Dark mode</span>
          </CommandItem>
          <CommandItem onSelect={() => pickTheme('system')}>
            <span className="h-4 w-4" />
            <span>System theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
