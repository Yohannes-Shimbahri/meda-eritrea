import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Rate Limiting ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; ts: number }>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now - entry.ts > windowMs) {
    rateLimitMap.set(key, { count: 1, ts: now })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

let cleanupCounter = 0
function maybeCleanup() {
  if (++cleanupCounter % 500 === 0) {
    const now = Date.now()
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.ts > 300_000) rateLimitMap.delete(key)
    }
  }
}

// ── Protected routes (require login) ─────────────────────────
const PROTECTED_ROUTES = [
  '/business/dashboard',
  '/client/dashboard',
  '/client/bookings',
  '/client/profile',
  '/admin',
]

// ── Guest only routes (redirect if logged in) ─────────────────
const GUEST_ONLY_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { pathname } = request.nextUrl

  maybeCleanup()

  // ── Rate Limiting ────────────────────────────────────────────
  if (['/api/client/create', '/api/business/create'].some(p => pathname.startsWith(p))) {
    if (!rateLimit(`auth:${ip}`, 10, 60_000))
      return NextResponse.json({ error: 'Too many requests. Please wait and try again.' }, { status: 429 })
  }

  if (pathname.startsWith('/api/bookings') && request.method === 'POST') {
    if (!rateLimit(`booking:${ip}`, 20, 60_000))
      return NextResponse.json({ error: 'Too many booking attempts. Please slow down.' }, { status: 429 })
  }

  if (pathname.startsWith('/api/admin') && request.method !== 'GET') {
    if (!rateLimit(`admin:${ip}`, 30, 60_000))
      return NextResponse.json({ error: 'Too many admin requests.' }, { status: 429 })
  }

  if (pathname.startsWith('/api/')) {
    if (!rateLimit(`api:${ip}`, 200, 60_000))
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  // ── Supabase session ─────────────────────────────────────────
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isGuestOnly = GUEST_ONLY_ROUTES.some(r => pathname.startsWith(r))

  // Not logged in → redirect to login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in → redirect away from login/register
  if (isGuestOnly && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Security Headers ─────────────────────────────────────────
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
}