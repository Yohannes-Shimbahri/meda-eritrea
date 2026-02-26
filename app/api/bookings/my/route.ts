import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await prisma.user.findUnique({ where: { email: user.email! } })
    if (!client) return NextResponse.json({ bookings: [] })

    const bookings = await prisma.booking.findMany({
      where: { clientId: client.id },
      include: {
        business: { select: { name: true, slug: true, city: true, category: true } },
        service: { select: { name: true, price: true, duration: true } },
        employee: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ bookings })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}