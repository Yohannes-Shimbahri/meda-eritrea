import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = createServerClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { employees } = await request.json()

    const business = await prisma.business.findFirst({
      where: { owner: { email: user.email! } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    await prisma.employee.deleteMany({ where: { businessId: business.id } })

    for (const emp of employees) {
      if (!emp.name?.trim()) continue
      await (prisma.employee.create as any)({
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

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = createServerClient(token)
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