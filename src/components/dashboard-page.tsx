'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Legend,
} from 'recharts'
import { FileText, FileCheck, Archive, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    fromDate: string | null
    toDate: string | null
    notes: string | null
    createdAt: string
  }>
  filesByCategory: Array<{ category: string; count: number }>
  filesByStatus: Array<{ status: string; count: number }>
  filesBySupplier: Array<{ supplier: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#10b981',
  Archived: '#64748b',
  Borrowed: '#f59e0b',
  Disposed: '#ef4444',
}

const CHART_COLORS = ['#10b981', '#14b8a6', '#64748b', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'Archived':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'Borrowed':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      return res.json()
    },
  })

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load dashboard data. Please try again.</p>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Files',
      value: data?.totalFiles ?? 0,
      icon: <FileText className="size-5" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Active Files',
      value: data?.activeFiles ?? 0,
      icon: <FileCheck className="size-5" />,
      gradient: 'from-teal-500 to-teal-600',
      bgLight: 'bg-teal-50 dark:bg-teal-950/30',
      iconBg: 'bg-teal-100 dark:bg-teal-900/50',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Archived Files',
      value: data?.archivedFiles ?? 0,
      icon: <Archive className="size-5" />,
      gradient: 'from-slate-500 to-slate-600',
      bgLight: 'bg-slate-50 dark:bg-slate-900/30',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
    {
      title: 'Borrowed Files',
      value: data?.borrowedFiles ?? 0,
      icon: <BookOpen className="size-5" />,
      gradient: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => (
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
                <div className={cn('flex size-12 items-center justify-center rounded-xl', card.iconBg)}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (data?.filesByCategory?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.filesByCategory ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="Files" radius={[4, 4, 0, 0]}>
                    {(data?.filesByCategory ?? []).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (data?.filesByStatus?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data?.filesByStatus ?? []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {(data?.filesByStatus ?? []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.recentFiles?.length ?? 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-mono text-sm">{file.fileCode}</TableCell>
                    <TableCell className="max-w-48 truncate">{file.title}</TableCell>
                    <TableCell>{file.category || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadgeVariant(file.status)}>
                        {file.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{file.fromDate || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{file.toDate || '-'}</TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground" title={file.notes || ''}>{file.notes || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No recent files
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
