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

    const { hours } = await request.json()

    const business = await prisma.business.findFirst({
      where: { owner: { email: user.email! } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Delete and recreate hours
    await prisma.businessHours.deleteMany({ where: { businessId: business.id } })

    await prisma.businessHours.createMany({
      data: hours.map((h: { day: string; open: string; close: string; closed: boolean }, i: number) => ({
        businessId: business.id,
        dayOfWeek: i,
        openTime: h.closed ? null : h.open,
        closeTime: h.closed ? null : h.close,
        isClosed: h.closed,
      }))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save hours' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email: user.email! } },
      include: { businessHours: { orderBy: { dayOfWeek: 'asc' } } }
    })

    return NextResponse.json({ hours: business?.businessHours || [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 })
  }
}