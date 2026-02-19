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

    const { employees } = await request.json()

    const business = await prisma.business.findFirst({
      where: { owner: { email: user.email! } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // For each employee, upsert
    for (const emp of employees) {
      if (!emp.name.trim()) continue
      await prisma.employee.create({
        data: {
          businessId: business.id,
          name: emp.name,
          specialty: emp.specialty || null,
          bio: emp.bio || null,
          avatarUrl: emp.photo || null,
          isActive: true,
          isAdmin: false,
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save employees' }, { status: 500 })
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
      include: { employees: { where: { isActive: true } } }
    })

    return NextResponse.json({ employees: business?.employees || [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}