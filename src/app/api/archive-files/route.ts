import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'
import { nullableTextValue, textValue, validateArchiveFileLookups, validateDateRange } from '@/lib/archive-file-input'

function includesText(value: unknown, search: string) {
  return String(value ?? '').toLowerCase().includes(search.toLowerCase())
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const searchParams = request.nextUrl.searchParams
    const search = textValue(searchParams.get('search'))
    const filters = {
      fileCode: textValue(searchParams.get('fileCode')),
      title: textValue(searchParams.get('title')),
      supplier: textValue(searchParams.get('supplier')),
      category: textValue(searchParams.get('category')),
      room: textValue(searchParams.get('room')),
      boxNumber: textValue(searchParams.get('boxNumber')),
      status: textValue(searchParams.get('status')),
      fromDate: textValue(searchParams.get('fromDate')),
      toDate: textValue(searchParams.get('toDate')),
      notes: textValue(searchParams.get('notes')),
    }

    const archiveFiles = await db.archiveFile.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const filtered = archiveFiles.filter((file) => {
      const searchable = [
        file.fileCode,
        file.title,
        file.supplier,
        file.category,
        file.room,
        file.boxNumber,
        file.status,
        file.fromDate,
        file.toDate,
        file.notes,
      ]

      if (search && !searchable.some((value) => includesText(value, search))) return false
      if (filters.fileCode && !includesText(file.fileCode, filters.fileCode)) return false
      if (filters.title && !includesText(file.title, filters.title)) return false
      if (filters.supplier && filters.supplier !== 'all' && !includesText(file.supplier, filters.supplier)) return false
      if (filters.category && filters.category !== 'all' && !includesText(file.category, filters.category)) return false
      if (filters.room && filters.room !== 'all' && !includesText(file.room, filters.room)) return false
      if (filters.status && filters.status !== 'all' && !includesText(file.status, filters.status)) return false
      if (filters.boxNumber && !includesText(file.boxNumber, filters.boxNumber)) return false
      if (filters.fromDate && !includesText(file.fromDate, filters.fromDate)) return false
      if (filters.toDate && !includesText(file.toDate, filters.toDate)) return false
      if (filters.notes && !includesText(file.notes, filters.notes)) return false
      return true
    })

    return NextResponse.json(filtered)
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
    const fromDate = nullableTextValue(body.fromDate)
    const toDate = nullableTextValue(body.toDate)
    const status = textValue(body.status) || 'Active'
    const notes = nullableTextValue(body.notes)

    if (!fileCode || !title) {
      return NextResponse.json(
        { error: 'fileCode and title are required' },
        { status: 400 }
      )
    }

    const dateError = validateDateRange(fromDate, toDate)
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 })
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
        fromDate,
        toDate,
        status,
        notes,
      },
    })

    await logActivity({
      action: 'CREATE',
      entityType: 'archive_file',
      entityId: String(archiveFile.id),
      description: `Created archive file: ${fileCode} - ${title}`,
      details: JSON.stringify({ fileCode, title, supplier, category, department, room, fromDate, toDate }),
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
