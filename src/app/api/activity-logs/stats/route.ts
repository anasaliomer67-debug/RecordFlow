import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)

    const [totalActivities, todayActivities, weekActivities, loginCount, uniqueUsers] = await Promise.all([
      db.activityLog.count(),
      db.activityLog.count({
        where: { createdAt: { gte: todayStart } },
      }),
      db.activityLog.count({
        where: { createdAt: { gte: weekStart } },
      }),
      db.activityLog.count({
        where: { action: 'LOGIN' },
      }),
      db.activityLog.findMany({
        where: { performedBy: { not: null } },
        select: { performedBy: true },
        distinct: ['performedBy'],
      }).then((r) => r.length),
    ])

    return NextResponse.json({
      totalActivities,
      todayActivities,
      weekActivities,
      loginCount,
      uniqueUsers,
    })
  } catch (error) {
    console.error('Error fetching activity stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity stats' },
      { status: 500 }
    )
  }
}
