/**
 * Central route registry.
 *
 * Single source of truth for every URL in the app. Sidebar, CommandPalette,
 * and any `<Link to={...}>` call should consume this — never inline a string.
 */
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingCart,
  Users,
} from 'lucide-react'

export const ROUTES = {
  dashboard: '/',
  products: {
    list: '/products',
    detail: (id) => `/products/${id}`,
  },
  customers: '/customers',
  orders: {
    list: '/orders',
    new: '/orders/new',
    detail: (id) => `/orders/${id}`,
  },
  analytics: '/analytics',
}

/**
 * Flat navigation list — used by CommandPalette and any consumer that wants
 * one continuous list instead of the grouped sidebar view.
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: LayoutDashboard, exact: true },
  { label: 'Products', path: ROUTES.products.list, icon: Package },
  { label: 'Customers', path: ROUTES.customers, icon: Users },
  { label: 'Orders', path: ROUTES.orders.list, icon: ShoppingCart },
  { label: 'Analytics', path: ROUTES.analytics, icon: BarChart3 },
]

/**
 * Sectioned navigation — used by the Sidebar.
 * Each group: { label: string|null, items: { label, path, icon, exact? }[] }
 */
export const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: 'Dashboard', path: ROUTES.dashboard, icon: LayoutDashboard, exact: true },
      { label: 'Products', path: ROUTES.products.list, icon: Package },
      { label: 'Customers', path: ROUTES.customers, icon: Users },
      { label: 'Orders', path: ROUTES.orders.list, icon: ShoppingCart },
    ],
  },
  {
    label: 'Quick actions',
    items: [
      { label: 'New order', path: ROUTES.orders.new, icon: Plus },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Analytics', path: ROUTES.analytics, icon: BarChart3 },
    ],
  },
]
