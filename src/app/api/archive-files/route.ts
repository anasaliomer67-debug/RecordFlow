import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fileCode: { contains: search } },
        { title: { contains: search } },
        { supplier: { contains: search } },
        { category: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    const archiveFiles = await db.archiveFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(archiveFiles)
  } catch (error) {
    console.error('Error fetching archive files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archive files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin', 'Manager'])
    if (!auth.authenticated) return auth.error

    const body = await request.json()
    const {
      fileCode,
      title,
      supplier,
      category,
      department,
      room,
      rack,
      shelf,
      boxNumber,
      retentionDate,
      status,
      notes,
    } = body

    if (!fileCode || !title) {
      return NextResponse.json(
        { error: 'fileCode and title are required' },
        { status: 400 }
      )
    }

    const archiveFile = await db.archiveFile.create({
      data: {
        fileCode,
        title,
        supplier: supplier || null,
        category: category || null,
        department: department || null,
        room: room || null,
        rack: rack || null,
        shelf: shelf || null,
        boxNumber: boxNumber || null,
        retentionDate: retentionDate || null,
        status: status || 'Active',
        notes: notes || null,
      },
    })

    await logActivity({
      action: 'CREATE',
      entityType: 'archive_file',
      entityId: String(archiveFile.id),
      description: `Created archive file: ${fileCode} - ${title}`,
      details: JSON.stringify({ fileCode, title, supplier, category, department, room }),
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(archiveFile, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating archive file:', error)
    const prismaError = error as { code?: string; meta?: { target?: string[] } }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'File code already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create archive file' },
      { status: 500 }
    )
  }
}
