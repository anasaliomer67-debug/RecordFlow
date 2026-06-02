import { create } from 'zustand'

export type PageType = 'dashboard' | 'archive-files' | 'locations' | 'reports' | 'settings'

interface AppState {
  activePage: PageType
  setActivePage: (page: PageType) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
