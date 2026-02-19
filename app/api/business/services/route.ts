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

    const { services } = await request.json()

    const business = await prisma.business.findFirst({
      where: { owner: { email: user.email! } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    await prisma.service.deleteMany({ where: { businessId: business.id } })

    const created = await prisma.service.createMany({
      data: services
        .filter((s: { name: string }) => s.name.trim())
        .map((s: { name: string; price: string; duration: string }) => ({
          businessId: business.id,
          name: s.name,
          price: parseFloat(s.price) || 0,
          duration: parseInt(s.duration) || 30,
          priceType: 'FIXED',
          isActive: true,
        }))
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save services' }, { status: 500 })
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
      where: { owner: { email: user.email! } },
      include: { services: { where: { isActive: true } } }
    })

    return NextResponse.json({ services: business?.services || [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}