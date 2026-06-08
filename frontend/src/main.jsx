import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster as HotToaster } from 'react-hot-toast'

import App from './App.jsx'
import { ThemeProvider } from './components/theme-provider.jsx'
import { TooltipProvider } from './components/ui/tooltip.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider delayDuration={200}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <HotToaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                className:
                  '!bg-card !text-card-foreground !border !border-border !shadow-md',
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
