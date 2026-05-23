import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Role = 'Admin' | 'Manager' | 'Staff'

interface AuthResult {
  authenticated: boolean
  user?: {
    id: string
    username: string
    role: string
    name?: string | null
  }
  error?: NextResponse
}

export async function requireAuth(allowedRoles?: Role[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
    }
  }

  const user = {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    name: session.user.name,
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role as Role)) {
      return {
        authenticated: false,
        user,
        error: NextResponse.json(
          { error: 'Access denied. Insufficient permissions.' },
          { status: 403 }
        ),
      }
    }
  }

  return { authenticated: true, user }
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireAuth(['Admin'])
}

export async function requireManager(): Promise<AuthResult> {
  return requireAuth(['Admin', 'Manager'])
}
