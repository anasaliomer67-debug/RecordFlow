import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const archiveFile = await db.archiveFile.findUnique({
      where: { id: parseInt(id) },
    })

    if (!archiveFile) {
      return NextResponse.json(
        { error: 'Archive file not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(archiveFile)
  } catch (error) {
    console.error('Error fetching archive file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archive file' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['Admin', 'Manager'])
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const body = await request.json()

    const existing = await db.archiveFile.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Archive file not found' },
        { status: 404 }
      )
    }

    const updatedFile = await db.archiveFile.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.fileCode !== undefined && { fileCode: body.fileCode }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.supplier !== undefined && { supplier: body.supplier || null }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.department !== undefined && { department: body.department || null }),
        ...(body.room !== undefined && { room: body.room || null }),
        ...(body.rack !== undefined && { rack: body.rack || null }),
        ...(body.shelf !== undefined && { shelf: body.shelf || null }),
        ...(body.boxNumber !== undefined && { boxNumber: body.boxNumber || null }),
        ...(body.retentionDate !== undefined && { retentionDate: body.retentionDate || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    // Detect status change for more specific logging
    const statusChanged = body.status !== undefined && body.status !== existing.status
    await logActivity({
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      entityType: 'archive_file',
      entityId: String(updatedFile.id),
      description: statusChanged
        ? `Changed status of "${existing.fileCode}" from "${existing.status}" to "${body.status}"`
        : `Updated archive file: ${existing.fileCode} - ${existing.title}`,
      details: JSON.stringify({
        changes: Object.keys(body).filter(k => body[k] !== undefined),
        fileCode: existing.fileCode,
      }),
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(updatedFile)
  } catch (error: unknown) {
    console.error('Error updating archive file:', error)
    const prismaError = error as { code?: string; meta?: { target?: string[] } }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'File code already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update archive file' },
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

    const existing = await db.archiveFile.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Archive file not found' },
        { status: 404 }
      )
    }

    await db.archiveFile.delete({
      where: { id: parseInt(id) },
    })

    await logActivity({
      action: 'DELETE',
      entityType: 'archive_file',
      entityId: String(existing.id),
      description: `Deleted archive file: ${existing.fileCode} - ${existing.title}`,
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json({ message: 'Archive file deleted successfully' })
  } catch (error) {
    console.error('Error deleting archive file:', error)
    return NextResponse.json(
      { error: 'Failed to delete archive file' },
      { status: 500 }
    )
  }
}
