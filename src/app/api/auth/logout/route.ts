import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user) {
      await logActivity({
        action: 'LOGOUT',
        entityType: 'user',
        entityId: session.user.id,
        description: `User "${session.user.username}" (${session.user.name}) logged out`,
        performedBy: session.user.username,
      })
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error logging logout:', error)
    return NextResponse.json({ message: 'Logged out' })
  }
}
