import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ token, req }) {
      const { pathname } = req.nextUrl

      // Allow login page without auth
      if (pathname.startsWith('/login')) {
        return true
      }

      // Allow NextAuth API routes
      if (pathname.startsWith('/api/auth')) {
        return true
      }

      // Require authentication for everything else
      return !!token
    },
  },
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
