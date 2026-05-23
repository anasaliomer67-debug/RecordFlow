import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const statuses = await db.status.findMany({
      orderBy: { statusName: 'asc' },
    })
    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error fetching statuses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statuses' },
      { status: 500 }
    )
  }
}
