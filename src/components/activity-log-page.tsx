'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ClipboardList, Activity, Clock, Trash2, Search, RefreshCw, AlertTriangle, UserCheck, FileText, Shield, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'

interface ActivityLogEntry {
  id: number
  action: string
  entityType: string
  entityId: string | null
  description: string
  details: string | null
  performedBy: string | null
  createdAt: string
}

interface ActivityStats {
  totalActivities: number
  todayActivities: number
  weekActivities: number
  loginCount: number
  uniqueUsers: number
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  LOGIN_LOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  LOGIN_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  CREATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  STATUS_CHANGE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

const entityTypeIcons: Record<string, React.ReactNode> = {
  user: <UserCheck className="size-3.5" />,
  archive_file: <FileText className="size-3.5" />,
  category: <ClipboardList className="size-3.5" />,
  supplier: <ClipboardList className="size-3.5" />,
  room: <ClipboardList className="size-3.5" />,
}

const emptyFilters = {
  search: '',
  action: 'all',
  entityType: 'all',
  user: '',
  description: '',
  fromDate: '',
  toDate: '',
}

export function ActivityLogPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const pageSize = 20

  const hasFilters = Object.entries(filters).some(([key, value]) => {
    if (['action', 'entityType'].includes(key)) return value !== 'all'
    return Boolean(value)
  })

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ActivityStats>({
    queryKey: ['activity-logs-stats'],
    queryFn: async () => {
      const res = await fetch('/api/activity-logs/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const { data: logsData, isLoading: logsLoading, isFetching, refetch: refetchLogs } = useQuery({
    queryKey: ['activity-logs', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      Object.entries(filters).forEach(([key, value]) => {
        if (!value || value === 'all') return
        params.set(key, value)
      })
      const res = await fetch(`/api/activity-logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch activity logs')
      return res.json()
    },
  })

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/activity-logs', { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to cleanup old activities')
      return result
    },
    onSuccess: (data) => {
      toast.success(data.message || `Cleaned up ${data.deletedCount} old activity logs`)
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      queryClient.invalidateQueries({ queryKey: ['activity-logs-stats'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateFilter = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchLogs(), refetchStats()])
      toast.success('Activity log refreshed')
    } catch {
      toast.error('Failed to refresh activity log')
    }
  }

  const getActionBadge = (action: string) => {
    const colorClass = actionColors[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    return <Badge variant="secondary" className={`text-xs font-medium ${colorClass}`}>{action}</Badge>
  }

  const statsCards = [
    { title: 'Total Activities', value: stats?.totalActivities ?? 0, icon: <Activity className="size-5 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { title: "Today's Activities", value: stats?.todayActivities ?? 0, icon: <Clock className="size-5 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { title: 'This Week', value: stats?.weekActivities ?? 0, icon: <ClipboardList className="size-5 text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { title: 'Login Events', value: stats?.loginCount ?? 0, icon: <Shield className="size-5 text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title}><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`flex size-10 items-center justify-center rounded-lg ${card.bg}`}>{card.icon}</div><div><p className="text-sm text-muted-foreground">{card.title}</p>{statsLoading ? <Skeleton className="h-6 w-12" /> : <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>}</div></div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="size-5 text-emerald-600" />Activity Log</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isFetching}><RefreshCw className="size-3.5" />Refresh</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>{cleanupMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Cleanup Old Logs</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search action, user, date, entity, description..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} className="pl-9" /></div>
            <Input placeholder="User" value={filters.user} onChange={(e) => updateFilter('user', e.target.value)} />
            <Input placeholder="Description" value={filters.description} onChange={(e) => updateFilter('description', e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={filters.action} onValueChange={(v) => updateFilter('action', v)}><SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="all">All Actions</SelectItem><SelectItem value="LOGIN">Login</SelectItem><SelectItem value="LOGOUT">Logout</SelectItem><SelectItem value="LOGIN_LOCKED">Account Locked</SelectItem><SelectItem value="CREATE">Create</SelectItem><SelectItem value="UPDATE">Update</SelectItem><SelectItem value="DELETE">Delete</SelectItem><SelectItem value="STATUS_CHANGE">Status Change</SelectItem></SelectContent></Select>
            <Select value={filters.entityType} onValueChange={(v) => updateFilter('entityType', v)}><SelectTrigger><SelectValue placeholder="Entity" /></SelectTrigger><SelectContent><SelectItem value="all">All Entities</SelectItem><SelectItem value="user">Users</SelectItem><SelectItem value="archive_file">Archive Files</SelectItem><SelectItem value="category">Categories</SelectItem><SelectItem value="supplier">Suppliers</SelectItem><SelectItem value="room">Rooms</SelectItem></SelectContent></Select>
            <Input type="date" value={filters.fromDate} onChange={(e) => updateFilter('fromDate', e.target.value)} />
            <Input type="date" value={filters.toDate} onChange={(e) => updateFilter('toDate', e.target.value)} />
            <Button variant="outline" className="gap-2" onClick={() => { setFilters(emptyFilters); setPage(1) }} disabled={!hasFilters}><X className="size-4" />Clear Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {logsLoading ? <div className="space-y-3 p-6">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : !logsData?.logs?.length ? <div className="flex flex-col items-center gap-3 py-12"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><AlertTriangle className="size-5 text-muted-foreground" /></div><p className="text-sm text-muted-foreground">No activity logs found</p></div> : (
            <>
              <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
                <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Description</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{logsData.logs.map((log: ActivityLogEntry) => <TableRow key={log.id}><TableCell>{getActionBadge(log.action)}</TableCell><TableCell><div className="flex items-center gap-1.5 text-sm">{entityTypeIcons[log.entityType] || <ClipboardList className="size-3.5" />}<span className="capitalize">{log.entityType.replace('_', ' ')}</span></div></TableCell><TableCell className="max-w-[360px]"><p className="truncate text-sm" title={log.description}>{log.description}</p></TableCell><TableCell><span className="text-sm text-muted-foreground">{log.performedBy || 'System'}</span></TableCell><TableCell><span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</span></TableCell></TableRow>)}</TableBody></Table>
              </div>
              {logsData.totalPages > 1 && <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-sm text-muted-foreground">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, logsData.total)} of {logsData.total} entries</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= logsData.totalPages}>Next</Button></div></div>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
