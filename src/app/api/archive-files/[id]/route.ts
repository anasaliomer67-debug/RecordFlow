import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'
import { nullableTextValue, textValue, validateArchiveFileLookups, validateDateRange } from '@/lib/archive-file-input'

function parseFileId(id: string) {
  const fileId = Number.parseInt(id, 10)
  return Number.isInteger(fileId) ? fileId : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const fileId = parseFileId(id)
    if (!fileId) {
      return NextResponse.json(
        { error: 'Invalid archive file id' },
        { status: 400 }
      )
    }

    const archiveFile = await db.archiveFile.findUnique({
      where: { id: fileId },
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
    const fileId = parseFileId(id)
    if (!fileId) {
      return NextResponse.json(
        { error: 'Invalid archive file id' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const existing = await db.archiveFile.findUnique({
      where: { id: fileId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Archive file not found' },
        { status: 404 }
      )
    }

    const data: Record<string, string | null> = {}

    if (body.fileCode !== undefined) data.fileCode = textValue(body.fileCode)
    if (body.title !== undefined) data.title = textValue(body.title)
    if (body.supplier !== undefined) data.supplier = nullableTextValue(body.supplier)
    if (body.category !== undefined) data.category = nullableTextValue(body.category)
    if (body.department !== undefined) data.department = nullableTextValue(body.department)
    if (body.room !== undefined) data.room = nullableTextValue(body.room)
    if (body.rack !== undefined) data.rack = nullableTextValue(body.rack)
    if (body.shelf !== undefined) data.shelf = nullableTextValue(body.shelf)
    if (body.boxNumber !== undefined) data.boxNumber = nullableTextValue(body.boxNumber)
    if (body.retentionDate !== undefined) data.retentionDate = nullableTextValue(body.retentionDate)
    if (body.fromDate !== undefined) data.fromDate = nullableTextValue(body.fromDate)
    if (body.toDate !== undefined) data.toDate = nullableTextValue(body.toDate)
    if (body.status !== undefined) data.status = textValue(body.status)
    if (body.notes !== undefined) data.notes = nullableTextValue(body.notes)

    if (data.fileCode !== undefined && !data.fileCode) {
      return NextResponse.json({ error: 'fileCode is required' }, { status: 400 })
    }

    if (data.title !== undefined && !data.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    if (data.status !== undefined && !data.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const nextFromDate = data.fromDate !== undefined ? data.fromDate : existing.fromDate
    const nextToDate = data.toDate !== undefined ? data.toDate : existing.toDate
    const dateError = validateDateRange(nextFromDate, nextToDate)
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 })
    }

    const lookupError = await validateArchiveFileLookups({
      supplier: data.supplier !== undefined ? data.supplier : undefined,
      category: data.category !== undefined ? data.category : undefined,
      room: data.room !== undefined ? data.room : undefined,
      status: data.status !== undefined ? data.status : undefined,
    })
    if (lookupError) {
      return NextResponse.json({ error: lookupError }, { status: 400 })
    }

    const updatedFile = await db.archiveFile.update({
      where: { id: fileId },
      data,
    })

    const statusChanged = data.status !== undefined && data.status !== existing.status
    await logActivity({
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      entityType: 'archive_file',
      entityId: String(updatedFile.id),
      description: statusChanged
        ? `Changed status of "${existing.fileCode}" from "${existing.status}" to "${data.status}"`
        : `Updated archive file: ${existing.fileCode} - ${existing.title}`,
      details: JSON.stringify({
        changes: Object.keys(body).filter((key) => body[key] !== undefined),
        fileCode: existing.fileCode,
        fromDate: updatedFile.fromDate,
        toDate: updatedFile.toDate,
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
    const fileId = parseFileId(id)
    if (!fileId) {
      return NextResponse.json(
        { error: 'Invalid archive file id' },
        { status: 400 }
      )
    }

    const existing = await db.archiveFile.findUnique({
      where: { id: fileId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Archive file not found' },
        { status: 404 }
      )
    }

    await db.archiveFile.delete({
      where: { id: fileId },
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
