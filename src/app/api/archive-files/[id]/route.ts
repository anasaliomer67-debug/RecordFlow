import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    return NextResponse.json({ message: 'Archive file deleted successfully' })
  } catch (error) {
    console.error('Error deleting archive file:', error)
    return NextResponse.json(
      { error: 'Failed to delete archive file' },
      { status: 500 }
    )
  }
}
