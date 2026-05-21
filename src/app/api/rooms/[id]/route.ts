import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { roomName } = body

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      )
    }

    const existing = await db.room.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const updated = await db.room.update({
      where: { id: parseInt(id) },
      data: { roomName },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Error updating room:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Room name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.room.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    await db.room.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}
