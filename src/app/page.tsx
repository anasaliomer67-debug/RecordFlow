'use client'

import { useAppStore, type PageType } from '@/store/app-store'
import { Sidebar, MobileSidebar } from '@/components/sidebar'
import { DashboardPage } from '@/components/dashboard-page'
import { ArchiveFilesPage } from '@/components/archive-files-page'
import { LocationsPage } from '@/components/locations-page'
import { UsersPage } from '@/components/users-page'
import { ReportsPage } from '@/components/reports-page'
import { SettingsPage } from '@/components/settings-page'
import { ActivityLogPage } from '@/components/activity-log-page'
import { AuthProvider } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, User, Shield } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const pageTitles: Record<PageType, string> = {
  dashboard: 'Dashboard',
  'archive-files': 'Archive Files',
  locations: 'Locations',
  users: 'Users',
  reports: 'Reports',
  'activity-log': 'Activity Log',
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
    case 'activity-log':
      return <ActivityLogPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

function UserMenu() {
  const { data: session } = useSession()
  if (!session?.user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <User className="size-3.5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <span className="hidden text-sm font-medium sm:inline-block">
            {session.user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">@{session.user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-xs text-muted-foreground" disabled>
          <Shield className="size-3.5" />
          Role: {session.user.role}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          onClick={async () => {
            try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
            signOut({ callbackUrl: '/login' })
          }}
        >
          <LogOut className="size-3.5" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AppContent() {
  const { activePage, setSidebarOpen } = useAppStore()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  }))

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MobileSidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
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
              <UserMenu />
            </header>

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

        <footer className="border-t bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          RecordFlow &copy; {new Date().getFullYear()} — Archive Management System
        </footer>
      </div>
    </QueryClientProvider>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
