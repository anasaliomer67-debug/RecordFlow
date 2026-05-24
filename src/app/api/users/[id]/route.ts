import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logActivity } from '@/lib/activity-logger'

const allowedRoles = new Set(['Admin', 'Manager', 'Staff'])

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const { id } = await params
    const userId = Number.parseInt(id, 10)
    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        { error: 'Invalid user id' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { fullName, role, isActive } = body

    const existing = await db.user.findUnique({
      where: { id: userId },
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
      const nextFullName = typeof fullName === 'string' ? fullName.trim() : ''
      if (!nextFullName) {
        return NextResponse.json(
          { error: 'fullName is required' },
          { status: 400 }
        )
      }

      updateData.fullName = nextFullName
      changes.push(`name: "${existing.fullName}" -> "${nextFullName}"`)
    }

    if (role !== undefined) {
      const nextRole = typeof role === 'string' ? role.trim() : ''
      if (!allowedRoles.has(nextRole)) {
        return NextResponse.json(
          { error: 'Invalid user role' },
          { status: 400 }
        )
      }

      updateData.role = nextRole
      changes.push(`role: "${existing.role}" -> "${nextRole}"`)
    }

    if (isActive !== undefined) {
      if (existing.username === auth.user?.username && !isActive) {
        return NextResponse.json(
          { error: 'You cannot deactivate your own account' },
          { status: 400 }
        )
      }

      updateData.isActive = isActive ? 1 : 0
      changes.push(`status: ${existing.isActive ? 'Active' : 'Inactive'} -> ${isActive ? 'Active' : 'Inactive'}`)
    }

    if (changes.length === 0) {
      return NextResponse.json(
        { error: 'No changes provided' },
        { status: 400 }
      )
    }

    const updated = await db.user.update({
      where: { id: userId },
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
    const userId = Number.parseInt(id, 10)
    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        { error: 'Invalid user id' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existing.username === auth.user?.username) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: userId },
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
