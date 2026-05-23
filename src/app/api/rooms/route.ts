import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const rooms = await db.room.findMany({
      orderBy: { roomName: 'asc' },
    })
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin', 'Manager'])
    if (!auth.authenticated) return auth.error

    const body = await request.json()
    const { roomName } = body

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      )
    }

    const room = await db.room.create({
      data: { roomName },
    })

    await logActivity({
      action: 'CREATE',
      entityType: 'room',
      entityId: String(room.id),
      description: `Created room: ${roomName}`,
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating room:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Room name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
