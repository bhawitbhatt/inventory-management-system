import { NavLink, Outlet } from 'react-router-dom'

import { classNames } from '../lib/format.js'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true, icon: HomeIcon },
  { to: '/products', label: 'Products', icon: BoxIcon },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/orders', label: 'Orders', icon: CartIcon },
]

export default function Layout() {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-brand-500" />
            <div>
              <h1 className="text-base font-semibold leading-tight sm:text-lg">
                Inventory &amp; Orders
              </h1>
              <p className="text-xs text-slate-400">Management Console</p>
            </div>
          </div>
          <nav className="hidden gap-1 md:flex">
            {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <nav className="border-t border-slate-800 md:hidden">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-2 sm:px-4">
            {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  classNames(
                    'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-500 sm:px-6">
        Built for the Software Engineer technical assessment · FastAPI + React + PostgreSQL ·
        Containerized
      </footer>
    </div>
  )
}

function IconBase({ children, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function HomeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </IconBase>
  )
}

function BoxIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </IconBase>
  )
}

function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  )
}

function CartIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.66 16h9.72a2 2 0 0 0 1.97-1.61L23 6H6" />
    </IconBase>
  )
}
