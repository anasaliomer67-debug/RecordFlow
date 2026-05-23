import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required')
        }

        const user = await db.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          throw new Error('Invalid username or password')
        }

        // Check if user is active
        if (user.isActive !== 1) {
          throw new Error('Your account has been deactivated. Contact administrator.')
        }

        // Check if account is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          const remainingMinutes = Math.ceil(
            (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
          )
          throw new Error(
            `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`
          )
        }

        // If lockout period has passed, reset the counter
        if (user.lockedUntil && new Date(user.lockedUntil) <= new Date()) {
          await db.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          })
        }

        // Verify password
        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          // Increment failed attempts
          const newFailedAttempts = user.failedAttempts + 1

          if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            // Lock the account
            const lockedUntil = new Date()
            lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_MINUTES)

            await db.user.update({
              where: { id: user.id },
              data: {
                failedAttempts: newFailedAttempts,
                lockedUntil,
              },
            })

            // Log failed login
            await logActivity({
              action: 'LOGIN_LOCKED',
              entityType: 'user',
              entityId: String(user.id),
              description: `Account locked after ${MAX_FAILED_ATTEMPTS} failed login attempts for user "${user.username}"`,
              performedBy: user.username,
            })

            throw new Error(
              `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`
            )
          }

          await db.user.update({
            where: { id: user.id },
            data: { failedAttempts: newFailedAttempts },
          })

          const remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts
          throw new Error(
            `Invalid username or password. ${remaining} attempt(s) remaining before account lockout.`
          )
        }

        // Successful login — reset failed attempts
        await db.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockedUntil: null },
        })

        // Log successful login
        await logActivity({
          action: 'LOGIN',
          entityType: 'user',
          entityId: String(user.id),
          description: `User "${user.username}" (${user.fullName}) logged in`,
          performedBy: user.username,
        })

        return {
          id: String(user.id),
          name: user.fullName,
          username: user.username,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username: string }).username
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}
