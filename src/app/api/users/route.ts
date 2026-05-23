import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth.error

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(['Admin'])
    if (!auth.authenticated) return auth.error

    const body = await request.json()
    const { username, password, fullName, role } = body

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'username, password, fullName, and role are required' },
        { status: 400 }
      )
    }

    // Hash the password with bcryptjs
    const hashedPassword = await hash(password, 12)

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
