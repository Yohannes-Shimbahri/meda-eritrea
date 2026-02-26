import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function isAdmin(token: string) {
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  return dbUser?.role === 'SUPER_ADMIN'
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !await isAdmin(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const businesses = await prisma.business.findMany({
    include: { owner: { select: { email: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ businesses })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !await isAdmin(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { businessId, ...updates } = await req.json()
  await prisma.business.update({ where: { id: businessId }, data: updates })
  return NextResponse.json({ success: true })
}