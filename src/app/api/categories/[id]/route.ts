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
    const categoryId = Number.parseInt(id, 10)
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category id' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const categoryName = typeof body.categoryName === 'string' ? body.categoryName.trim() : ''

    if (!categoryName) {
      return NextResponse.json(
        { error: 'categoryName is required' },
        { status: 400 }
      )
    }

    const existing = await db.category.findUnique({
      where: { id: categoryId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const [updated, updatedFiles] = await db.$transaction([
      db.category.update({
        where: { id: categoryId },
        data: { categoryName },
      }),
      db.archiveFile.updateMany({
        where: { category: existing.categoryName },
        data: { category: categoryName },
      }),
    ])

    await logActivity({
      action: 'UPDATE',
      entityType: 'category',
      entityId: String(updated.id),
      description: `Updated category: "${existing.categoryName}" -> "${categoryName}"`,
      details: JSON.stringify({ updatedArchiveFiles: updatedFiles.count }),
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Error updating category:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    const categoryId = Number.parseInt(id, 10)
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category id' },
        { status: 400 }
      )
    }

    const existing = await db.category.findUnique({
      where: { id: categoryId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const [updatedFiles] = await db.$transaction([
      db.archiveFile.updateMany({
        where: { category: existing.categoryName },
        data: { category: null },
      }),
      db.category.delete({
        where: { id: categoryId },
      }),
    ])

    await logActivity({
      action: 'DELETE',
      entityType: 'category',
      entityId: String(existing.id),
      description: `Deleted category: ${existing.categoryName}`,
      details: JSON.stringify({ clearedArchiveFiles: updatedFiles.count }),
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
