import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const categories = await db.category.findMany({
      orderBy: { categoryName: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin', 'Manager'])
    if (!auth.authenticated) return auth.error

    const body = await request.json()
    const categoryName = typeof body.categoryName === 'string' ? body.categoryName.trim() : ''

    if (!categoryName) {
      return NextResponse.json(
        { error: 'categoryName is required' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: { categoryName },
    })

    await logActivity({
      action: 'CREATE',
      entityType: 'category',
      entityId: String(category.id),
      description: `Created category: ${categoryName}`,
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating category:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
