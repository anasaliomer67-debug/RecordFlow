'use client'

import { useAppStore, type PageType } from '@/store/app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Archive,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Moon,
  Sun,
  FolderOpen,
  ClipboardList,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface NavItem {
  id: PageType
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" /> },
  { id: 'archive-files', label: 'Archive Files', icon: <Archive className="size-5" /> },
  { id: 'locations', label: 'Locations', icon: <MapPin className="size-5" /> },
  { id: 'users', label: 'Users', icon: <Users className="size-5" />, adminOnly: true },
  { id: 'activity-log', label: 'Activity Log', icon: <ClipboardList className="size-5" />, adminOnly: true },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="size-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-5" />, adminOnly: true },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { activePage, setActivePage } = useAppStore()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'Admin'

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  const handleNavClick = (id: PageType) => {
    setActivePage(id)
    onNavClick?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <FolderOpen className="size-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">RecordFlow</h1>
          <p className="text-xs text-muted-foreground">Archive Management</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              activePage === item.id
                ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-600/20'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <span className={cn(
              activePage === item.id && 'text-emerald-600 dark:text-emerald-400'
            )}>
              {item.icon}
            </span>
            {item.label}
            {item.adminOnly && (
              <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Admin
              </span>
            )}
          </button>
        ))}
      </nav>

      <Separator />

      {/* Theme toggle */}
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-3"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          <span className="text-sm">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r bg-card">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
