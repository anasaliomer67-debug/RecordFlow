import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { cleanupOldActivities } from '@/lib/activity-logger'

function includesText(value: unknown, search: string) {
  return String(value ?? '').toLowerCase().includes(search.toLowerCase())
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const { searchParams } = new URL(request.url)
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10)
    const requestedPageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10)
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const pageSize = Number.isInteger(requestedPageSize) ? Math.min(Math.max(requestedPageSize, 1), 100) : 20
    const search = searchParams.get('search')?.trim() || ''
    const action = searchParams.get('action')?.trim() || 'all'
    const entityType = searchParams.get('entityType')?.trim() || 'all'
    const user = searchParams.get('user')?.trim() || ''
    const description = searchParams.get('description')?.trim() || ''
    const fromDate = searchParams.get('fromDate')?.trim() || ''
    const toDate = searchParams.get('toDate')?.trim() || ''

    const where: Record<string, unknown> = {}
    if (action && action !== 'all') where.action = action
    if (entityType && entityType !== 'all') where.entityType = entityType
    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate ? { gte: new Date(`${fromDate}T00:00:00.000Z`) } : {}),
        ...(toDate ? { lte: new Date(`${toDate}T23:59:59.999Z`) } : {}),
      }
    }

    const logs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const filtered = logs.filter((log) => {
      const dateText = log.createdAt.toISOString().slice(0, 10)
      const searchable = [log.action, log.entityType, log.performedBy, log.description, dateText]
      if (search && !searchable.some((value) => includesText(value, search))) return false
      if (user && !includesText(log.performedBy, user)) return false
      if (description && !includesText(log.description, description)) return false
      return true
    })

    const total = filtered.length
    const start = (page - 1) * pageSize
    const pagedLogs = filtered.slice(start, start + pageSize)

    return NextResponse.json({
      logs: pagedLogs,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const deletedCount = await cleanupOldActivities()

    return NextResponse.json({
      message: deletedCount > 0 ? `Cleaned up ${deletedCount} old activity logs` : 'No old activity logs needed cleanup',
      deletedCount,
    })
  } catch (error) {
    console.error('Error cleaning up activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup activity logs' },
      { status: 500 }
    )
  }
}
