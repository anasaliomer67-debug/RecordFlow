import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
