import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      // Check if this is a new user (no terms accepted yet)
      const termsAccepted = user.user_metadata?.terms_accepted

      if (!termsAccepted) {
        // New Google user — redirect to terms acceptance page
        // We pass their intended destination so we can redirect after acceptance
        const destination = user.user_metadata?.role === 'BUSINESS_OWNER'
          ? '/business/dashboard'
          : '/client/dashboard'
        return NextResponse.redirect(
          new URL(`/accept-terms?next=${destination}`, requestUrl.origin)
        )
      }

      // Existing user who already accepted — upsert DB record and redirect
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email.split('@')[0],
          role: user.user_metadata?.role === 'BUSINESS_OWNER' ? 'BUSINESS_OWNER' : 'CLIENT',
        },
      })

      if (user.user_metadata?.role === 'BUSINESS_OWNER') {
        return NextResponse.redirect(new URL('/business/dashboard', requestUrl.origin))
      }

      return NextResponse.redirect(new URL('/client/dashboard', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/client/dashboard', requestUrl.origin))
}