import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
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
