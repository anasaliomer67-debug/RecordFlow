'use client'

import { useAppStore, type PageType } from '@/store/app-store'
import { Sidebar, MobileSidebar } from '@/components/sidebar'
import { DashboardPage } from '@/components/dashboard-page'
import { ArchiveFilesPage } from '@/components/archive-files-page'
import { LocationsPage } from '@/components/locations-page'
import { UsersPage } from '@/components/users-page'
import { ReportsPage } from '@/components/reports-page'
import { SettingsPage } from '@/components/settings-page'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const pageTitles: Record<PageType, string> = {
  dashboard: 'Dashboard',
  'archive-files': 'Archive Files',
  locations: 'Locations',
  users: 'Users',
  reports: 'Reports',
  settings: 'Settings',
}

function PageContent({ page }: { page: PageType }) {
  switch (page) {
    case 'dashboard':
      return <DashboardPage />
    case 'archive-files':
      return <ArchiveFilesPage />
    case 'locations':
      return <LocationsPage />
    case 'users':
      return <UsersPage />
    case 'reports':
      return <ReportsPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

export default function Home() {
  const { activePage, setSidebarOpen } = useAppStore()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Desktop */}
          <Sidebar />
          {/* Sidebar - Mobile */}
          <MobileSidebar />

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{pageTitles[activePage]}</h1>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <PageContent page={activePage} />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          RecordFlow &copy; {new Date().getFullYear()} — Archive Management System
        </footer>
      </div>
    </QueryClientProvider>
  )
}
