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
    const supplierId = Number.parseInt(id, 10)
    if (!Number.isInteger(supplierId)) {
      return NextResponse.json(
        { error: 'Invalid supplier id' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const supplierName = typeof body.supplierName === 'string' ? body.supplierName.trim() : ''

    if (!supplierName) {
      return NextResponse.json(
        { error: 'supplierName is required' },
        { status: 400 }
      )
    }

    const existing = await db.supplier.findUnique({
      where: { id: supplierId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    const [updated, updatedFiles] = await db.$transaction([
      db.supplier.update({
        where: { id: supplierId },
        data: { supplierName },
      }),
      db.archiveFile.updateMany({
        where: { supplier: existing.supplierName },
        data: { supplier: supplierName },
      }),
    ])

    await logActivity({
      action: 'UPDATE',
      entityType: 'supplier',
      entityId: String(updated.id),
      description: `Updated supplier: "${existing.supplierName}" -> "${supplierName}"`,
      details: JSON.stringify({ updatedArchiveFiles: updatedFiles.count }),
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Error updating supplier:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Supplier name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update supplier' },
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
    const supplierId = Number.parseInt(id, 10)
    if (!Number.isInteger(supplierId)) {
      return NextResponse.json(
        { error: 'Invalid supplier id' },
        { status: 400 }
      )
    }

    const existing = await db.supplier.findUnique({
      where: { id: supplierId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    const [updatedFiles] = await db.$transaction([
      db.archiveFile.updateMany({
        where: { supplier: existing.supplierName },
        data: { supplier: null },
      }),
      db.supplier.delete({
        where: { id: supplierId },
      }),
    ])

    await logActivity({
      action: 'DELETE',
      entityType: 'supplier',
      entityId: String(existing.id),
      description: `Deleted supplier: ${existing.supplierName}`,
      details: JSON.stringify({ clearedArchiveFiles: updatedFiles.count }),
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
