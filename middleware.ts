import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiter setup (fallback to memory if Redis unavailable)
const redis = process.env.REDIS_URL
  ? new Redis({ url: process.env.REDIS_URL })
  : new Map() as any

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
})

export async function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  const { pathname } = request.nextUrl
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'

  // Apply rate limiting to API routes and auth endpoints
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      })
    }

    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
  }

  // Public paths that visitors can access without authentication
  const publicPaths = ["/", "/blog", "/recipes/view", "/about", "/contact"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path) || pathname === path)

  // Paths that require authentication
  const protectedPaths = ["/dashboard", "/recipes/create", "/recipes/edit", "/admin", "/profile", "/analytics"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  // Dashboard access control - VIEWER should not access dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      // Not authenticated - redirect to login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (token.role === "VIEWER") {
      // VIEWER trying to access dashboard - redirect to feed with message
      const feedUrl = new URL("/feed", request.url)
      feedUrl.searchParams.set("message", "dashboard-access-denied")
      return NextResponse.redirect(feedUrl)
    }

    // Only ADMIN and EDITOR can access dashboard
    if (!["ADMIN", "EDITOR"].includes(token.role as string)) {
      const feedUrl = new URL("/feed", request.url)
      feedUrl.searchParams.set("message", "insufficient-permissions")
      return NextResponse.redirect(feedUrl)
    }
  }

  // Visitor interaction paths (require sign-in for actions)
  const visitorInteractionPaths = ["/api/recipes/like", "/api/recipes/comment", "/api/recipes/save"]
  const isVisitorInteractionPath = visitorInteractionPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath || isVisitorInteractionPath) {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If no token exists, redirect to login
    if (!token) {
      // For API routes, return 401 instead of redirect
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({
            error: 'Authentication required',
            message: 'Please sign in to perform this action'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // All authenticated users can access basic features
    // Role-specific restrictions are handled below

    // Role-based access control
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return new NextResponse('Forbidden - Admin access required', { status: 403 })
    }

    // Analytics access - Admin and Editor only
    if (pathname.startsWith("/analytics") && !["ADMIN", "EDITOR"].includes(token.role as string)) {
      return new NextResponse('Forbidden - Editor or Admin access required', { status: 403 })
    }

    // Recipe creation - Admin and Editor only (Editor creates as draft)
    if (pathname.startsWith("/recipes/create") && !["ADMIN", "EDITOR"].includes(token.role as string)) {
      return new NextResponse('Forbidden - Content creator access required', { status: 403 })
    }

    // Recipe editing - Admin and Editor only (with ownership rules)
    if (pathname.startsWith("/recipes/edit") && !["ADMIN", "EDITOR"].includes(token.role as string)) {
      return new NextResponse('Forbidden - Content creator access required', { status: 403 })
    }

    // Dashboard access - All authenticated users can see their dashboard
    // But different content based on role
  }

  // If user is logged in and tries to access login page, redirect based on role
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (token) {
      // Role-based redirects after login
      if (token.role === "ADMIN" || token.role === "EDITOR") {
        // Admin and Editor go to dashboard for content management
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      } else {
        // VIEWER goes to feed to browse recipes
        const feedUrl = new URL("/feed", request.url)
        return NextResponse.redirect(feedUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
