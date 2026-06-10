/**
 * Central route registry.
 *
 * Single source of truth for every URL in the app. Sidebar, CommandPalette,
 * and any `<Link to={...}>` call should consume this — never inline a string.
 */
import { BarChart3, LayoutDashboard, Package, ShoppingCart, Users } from 'lucide-react'

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
 * Primary navigation items rendered in the Sidebar + CommandPalette.
 * Each item: { label, path, icon (lucide component), exact? }
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: LayoutDashboard, exact: true },
  { label: 'Products', path: ROUTES.products.list, icon: Package },
  { label: 'Customers', path: ROUTES.customers, icon: Users },
  { label: 'Orders', path: ROUTES.orders.list, icon: ShoppingCart },
  { label: 'Analytics', path: ROUTES.analytics, icon: BarChart3 },
]
