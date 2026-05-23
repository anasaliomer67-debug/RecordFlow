import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const body = await request.json()
    const { fullName, role, isActive } = body

    const existing = await db.user.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const changes: string[] = []

    if (fullName !== undefined) {
      updateData.fullName = fullName
      changes.push(`name: "${existing.fullName}" → "${fullName}"`)
    }
    if (role !== undefined) {
      updateData.role = role
      changes.push(`role: "${existing.role}" → "${role}"`)
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive ? 1 : 0
      changes.push(`status: ${existing.isActive ? 'Active' : 'Inactive'} → ${isActive ? 'Active' : 'Inactive'}`)
    }

    const updated = await db.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    })

    await logActivity({
      action: 'UPDATE',
      entityType: 'user',
      entityId: String(updated.id),
      description: `Updated user @${existing.username}: ${changes.join(', ')}`,
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
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

    const existing = await db.user.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting yourself
    if (existing.username === auth.user?.username) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: parseInt(id) },
    })

    await logActivity({
      action: 'DELETE',
      entityType: 'user',
      entityId: String(existing.id),
      description: `Deleted user: ${existing.fullName} (@${existing.username})`,
      performedBy: auth.user?.username || null,
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
