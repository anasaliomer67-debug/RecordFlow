import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { cleanupOldActivities } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || 'all'
    const entityType = searchParams.get('entityType') || 'all'

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { performedBy: { contains: search } },
        { action: { contains: search } },
      ]
    }

    if (action && action !== 'all') {
      where.action = action
    }

    if (entityType && entityType !== 'all') {
      where.entityType = entityType
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.activityLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
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
      message: `Cleaned up ${deletedCount} old activity logs`,
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
