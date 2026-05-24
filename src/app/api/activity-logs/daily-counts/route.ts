import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const { searchParams } = new URL(request.url)
    const requestedDays = Number.parseInt(searchParams.get('days') || '30', 10)
    const days = Number.isInteger(requestedDays)
      ? Math.min(Math.max(requestedDays, 1), 365)
      : 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get all activity logs within the date range
    const logs = await db.activityLog.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        action: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const dailyCounts: Record<string, { date: string; count: number; logins: number; actions: number }> = {}

    // Initialize all dates in range
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dailyCounts[dateStr] = { date: dateStr, count: 0, logins: 0, actions: 0 }
    }

    // Count logs per day
    logs.forEach((log) => {
      const dateStr = log.createdAt.toISOString().split('T')[0]
      if (dailyCounts[dateStr]) {
        dailyCounts[dateStr].count++
        if (log.action === 'LOGIN') {
          dailyCounts[dateStr].logins++
        }
        if (['CREATE', 'UPDATE', 'DELETE'].includes(log.action)) {
          dailyCounts[dateStr].actions++
        }
      }
    })

    return NextResponse.json(Object.values(dailyCounts))
  } catch (error) {
    console.error('Error fetching daily counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily counts' },
      { status: 500 }
    )
  }
}
