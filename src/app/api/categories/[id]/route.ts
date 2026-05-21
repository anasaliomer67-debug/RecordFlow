import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
