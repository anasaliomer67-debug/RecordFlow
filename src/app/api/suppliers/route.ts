import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const suppliers = await db.supplier.findMany({
      orderBy: { supplierName: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin', 'Manager'])
    if (!auth.authenticated) return auth.error

    const body = await request.json()
    const supplierName = typeof body.supplierName === 'string' ? body.supplierName.trim() : ''

    if (!supplierName) {
      return NextResponse.json(
        { error: 'supplierName is required' },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.create({
      data: { supplierName },
    })

    await logActivity({
      action: 'CREATE',
      entityType: 'supplier',
      entityId: String(supplier.id),
      description: `Created supplier: ${supplierName}`,
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating supplier:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Supplier name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
