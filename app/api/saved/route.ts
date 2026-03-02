import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function getUserFromToken(token: string) {
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { email: user.email! } })
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ saved: false })
    const dbUser = await getUserFromToken(token)
    if (!dbUser) return NextResponse.json({ saved: false })

    const { searchParams } = new URL(req.url)
    const businessSlug = searchParams.get('businessSlug')

    if (businessSlug) {
      const business = await prisma.business.findUnique({ where: { slug: businessSlug }, select: { id: true } })
      if (!business) return NextResponse.json({ saved: false })
      const saved = await prisma.savedBusiness.findFirst({ where: { userId: dbUser.id, businessId: business.id } })
      return NextResponse.json({ saved: !!saved })
    }

    const saved = await (prisma as any).savedBusiness.findMany({
      where: { userId: dbUser.id },
      include: {
        business: {
          include: {
            category: true,
            media: { where: { caption: 'cover' }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      businesses: saved.map((s: any) => ({
        id: s.business.id,
        name: s.business.name,
        slug: s.business.slug,
        category: s.business.category
          ? { id: s.business.category.id, name: s.business.category.name, slug: s.business.category.slug }
          : null,
        city: s.business.city,
        subscription: s.business.subscription,
        coverImage: s.business.media?.[0]?.url || null,
        savedAt: s.createdAt,
      }))
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ saved: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const dbUser = await getUserFromToken(token)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const { businessId } = await req.json()
    await prisma.savedBusiness.upsert({
      where: { userId_businessId: { userId: dbUser.id, businessId } },
      update: {},
      create: { userId: dbUser.id, businessId },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const dbUser = await getUserFromToken(token)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const { businessId } = await req.json()
    await prisma.savedBusiness.deleteMany({ where: { userId: dbUser.id, businessId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}