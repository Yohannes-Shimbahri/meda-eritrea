import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, phone, address, instagram, facebook, website, bio } = body

    const business = await prisma.business.update({
      where: { owner: { email: user.email! } } as never,
      data: {
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        website: website || undefined,
        description: bio || undefined,
      }
    })

    return NextResponse.json({ success: true, business })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email: user.email! } }
    })

    return NextResponse.json({ business })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}