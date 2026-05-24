import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['Admin', 'Manager'])
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const roomId = Number.parseInt(id, 10)
    if (!Number.isInteger(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room id' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const roomName = typeof body.roomName === 'string' ? body.roomName.trim() : ''

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      )
    }

    const existing = await db.room.findUnique({
      where: { id: roomId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const [updated, updatedFiles] = await db.$transaction([
      db.room.update({
        where: { id: roomId },
        data: { roomName },
      }),
      db.archiveFile.updateMany({
        where: { room: existing.roomName },
        data: { room: roomName },
      }),
    ])

    await logActivity({
      action: 'UPDATE',
      entityType: 'room',
      entityId: String(updated.id),
      description: `Updated room: "${existing.roomName}" -> "${roomName}"`,
      details: JSON.stringify({ updatedArchiveFiles: updatedFiles.count }),
      performedBy: auth.user?.username || null,
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
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const roomId = Number.parseInt(id, 10)
    if (!Number.isInteger(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room id' },
        { status: 400 }
      )
    }

    const existing = await db.room.findUnique({
      where: { id: roomId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const [updatedFiles] = await db.$transaction([
      db.archiveFile.updateMany({
        where: { room: existing.roomName },
        data: { room: null },
      }),
      db.room.delete({
        where: { id: roomId },
      }),
    ])

    await logActivity({
      action: 'DELETE',
      entityType: 'room',
      entityId: String(existing.id),
      description: `Deleted room: ${existing.roomName}`,
      details: JSON.stringify({ clearedArchiveFiles: updatedFiles.count }),
      performedBy: auth.user?.username || null,
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
