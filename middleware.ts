import { NextRequest, NextResponse } from 'next/server'

// ── Rate Limiting ─────────────────────────────────────────────────────────────
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

// ── Route lists ───────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = [
  '/business/dashboard',
  '/client/dashboard',
  '/client/bookings',
  '/client/profile',
  '/admin',
]

const GUEST_ONLY_ROUTES = ['/login', '/register']

// ── Middleware ────────────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { pathname } = req.nextUrl

  maybeCleanup()

  // ── Security Headers (applied to all responses) ───────────────────────────
  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com",
      "frame-src https://js.stripe.com",
    ].join('; ')
  )

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  // Auth/signup — 10 per minute per IP
  if (['/api/client/create', '/api/business/create'].some(p => pathname.startsWith(p))) {
    if (!rateLimit(`auth:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please wait and try again.' }, { status: 429 })
    }
  }

  // Booking creation — 20 per minute per IP
  if (pathname.startsWith('/api/bookings') && req.method === 'POST') {
    if (!rateLimit(`booking:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many booking attempts. Please slow down.' }, { status: 429 })
    }
  }

  // Admin writes — 30 per minute per IP
  if (pathname.startsWith('/api/admin') && req.method !== 'GET') {
    if (!rateLimit(`admin:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many admin requests.' }, { status: 429 })
    }
  }

  // General API — 200 per minute per IP
  if (pathname.startsWith('/api/')) {
    if (!rateLimit(`api:${ip}`, 200, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }
  }

  // ── Route Protection ──────────────────────────────────────────────────────
  // Read Supabase session cookie (Supabase stores it under this key pattern)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] ?? ''
  const sessionCookie =
    req.cookies.get(`sb-${projectRef}-auth-token`)?.value ??
    req.cookies.get('sb-access-token')?.value

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isGuestOnly = GUEST_ONLY_ROUTES.some(r => pathname.startsWith(r))

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isGuestOnly && sessionCookie) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
}