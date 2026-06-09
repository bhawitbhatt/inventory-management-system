import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { API_BASE_URL } from '../api/client.js'
import { CommandPalette, useCommandPaletteShortcut } from './layout/CommandPalette.jsx'
import { DesktopSidebar, MobileSidebar } from './layout/Sidebar.jsx'
import { TopBar } from './layout/TopBar.jsx'

const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const location = useLocation()

  useCommandPaletteShortcut(setCommandOpen)

  useEffect(() => {
    const ping = () => {
      fetch(`${API_BASE_URL}/health`, { mode: 'cors' }).catch(() => {})
    }
    ping()
    const id = setInterval(ping, KEEPALIVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <div className="flex flex-1">
        <DesktopSidebar />
        <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenCommand={() => setCommandOpen(true)}
          />
          <main id="main-content" className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
