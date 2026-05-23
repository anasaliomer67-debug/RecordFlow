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
    const body = await request.json()
    const { categoryName } = body

    if (!categoryName) {
      return NextResponse.json(
        { error: 'categoryName is required' },
        { status: 400 }
      )
    }

    const existing = await db.category.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const updated = await db.category.update({
      where: { id: parseInt(id) },
      data: { categoryName },
    })

    await logActivity({
      action: 'UPDATE',
      entityType: 'category',
      entityId: String(updated.id),
      description: `Updated category: "${existing.categoryName}" → "${categoryName}"`,
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

    const existing = await db.category.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    await db.category.delete({
      where: { id: parseInt(id) },
    })

    await logActivity({
      action: 'DELETE',
      entityType: 'category',
      entityId: String(existing.id),
      description: `Deleted category: ${existing.categoryName}`,
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
