'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { FileText, TrendingUp, Archive, BookOpen } from 'lucide-react'

interface DashboardData {
  totalFiles: number
  activeFiles: number
  archivedFiles: number
  borrowedFiles: number
  totalCategories: number
  totalSuppliers: number
  totalRooms: number
  totalUsers: number
  recentFiles: Array<{
    id: number
    fileCode: string
    title: string
    category: string | null
    status: string
    createdAt: string
  }>
  filesByCategory: Array<{ category: string; count: number }>
  filesByStatus: Array<{ status: string; count: number }>
  filesBySupplier: Array<{ supplier: string; count: number }>
}

interface ArchiveFile {
  id: number
  fileCode: string
  title: string
  room: string | null
  createdAt: string
}

const CHART_COLORS = ['#10b981', '#14b8a6', '#64748b', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ReportsPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      return res.json()
    },
  })

  const { data: archiveFiles = [] } = useQuery<ArchiveFile[]>({
    queryKey: ['archive-files-all'],
    queryFn: async () => {
      const res = await fetch('/api/archive-files')
      if (!res.ok) throw new Error('Failed to fetch archive files')
      return res.json()
    },
  })

  // Compute files by room
  const filesByRoom = archiveFiles.reduce<Record<string, number>>((acc, file) => {
    const room = file.room || 'Unassigned'
    acc[room] = (acc[room] || 0) + 1
    return acc
  }, {})

  const filesByRoomData = Object.entries(filesByRoom).map(([room, count]) => ({
    room,
    count,
  }))

  // Compute files added over time (by month)
  const filesByMonth = archiveFiles.reduce<Record<string, number>>((acc, file) => {
    const date = new Date(file.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {})

  const filesByMonthData = Object.entries(filesByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month,
      count,
    }))

  const totalFiles = data?.totalFiles ?? 0
  const activePercent = totalFiles > 0 ? ((data?.activeFiles ?? 0) / totalFiles * 100).toFixed(1) : '0'
  const archivedPercent = totalFiles > 0 ? ((data?.archivedFiles ?? 0) / totalFiles * 100).toFixed(1) : '0'
  const borrowedPercent = totalFiles > 0 ? ((data?.borrowedFiles ?? 0) / totalFiles * 100).toFixed(1) : '0'

  const summaryCards = [
    {
      title: 'Total Files',
      value: totalFiles,
      icon: <FileText className="size-5" />,
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Active %',
      value: `${activePercent}%`,
      icon: <TrendingUp className="size-5" />,
      bgLight: 'bg-teal-50 dark:bg-teal-950/30',
      iconBg: 'bg-teal-100 dark:bg-teal-900/50',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Archived %',
      value: `${archivedPercent}%`,
      icon: <Archive className="size-5" />,
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
    {
      title: 'Borrowed %',
      value: `${borrowedPercent}%`,
      icon: <BookOpen className="size-5" />,
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Analytics and insights for your archive</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={card.bgLight}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold">{card.value}</p>
                  )}
                </div>
                <div className={`flex size-12 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Files by Supplier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (data?.filesBySupplier?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.filesBySupplier ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="supplier" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="Files" radius={[4, 4, 0, 0]}>
                    {(data?.filesBySupplier ?? []).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No supplier data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files added over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files Added Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : filesByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={filesByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Files"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No time data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Files by Room - Horizontal bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files by Room</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filesByRoomData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, filesByRoomData.length * 50)}>
              <BarChart data={filesByRoomData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="room" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="Files" radius={[0, 4, 4, 0]}>
                  {filesByRoomData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No room data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
