import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'
import { nullableTextValue, textValue, validateArchiveFileLookups } from '@/lib/archive-file-input'

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
    const fileCode = textValue(body.fileCode)
    const title = textValue(body.title)
    const supplier = nullableTextValue(body.supplier)
    const category = nullableTextValue(body.category)
    const department = nullableTextValue(body.department)
    const room = nullableTextValue(body.room)
    const rack = nullableTextValue(body.rack)
    const shelf = nullableTextValue(body.shelf)
    const boxNumber = nullableTextValue(body.boxNumber)
    const retentionDate = nullableTextValue(body.retentionDate)
    const status = textValue(body.status) || 'Active'
    const notes = nullableTextValue(body.notes)

    if (!fileCode || !title) {
      return NextResponse.json(
        { error: 'fileCode and title are required' },
        { status: 400 }
      )
    }

    const lookupError = await validateArchiveFileLookups({ supplier, category, room, status })
    if (lookupError) {
      return NextResponse.json(
        { error: lookupError },
        { status: 400 }
      )
    }

    const archiveFile = await db.archiveFile.create({
      data: {
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
