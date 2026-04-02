import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient(token)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Upsert user in DB — safe to call multiple times
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email.split('@')[0],
        role: 'CLIENT',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ensure-user]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}