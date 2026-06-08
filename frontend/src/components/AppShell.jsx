import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { CommandPalette, useCommandPaletteShortcut } from './layout/CommandPalette.jsx'
import { DesktopSidebar, MobileSidebar } from './layout/Sidebar.jsx'
import { TopBar } from './layout/TopBar.jsx'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  useCommandPaletteShortcut(setCommandOpen)

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
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
