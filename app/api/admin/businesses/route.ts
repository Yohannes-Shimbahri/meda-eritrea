import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

async function getAdminUser(token: string) {
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') return null
  return dbUser
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !await getAdminUser(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const businesses = await prisma.business.findMany({
    include: {
      owner: { select: { email: true, fullName: true } },
      category: { select: { id: true, name: true, slug: true, icon: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ businesses })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !await getAdminUser(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rawBody = await req.json()

  // ── Validate — only allow specific fields, nothing else ───
  const Schema = z.object({
    businessId: z.string().uuid('Invalid businessId'),
    isVerified: z.boolean().optional(),
    isApproved: z.boolean().optional(),
    isActive: z.boolean().optional(),
    subscription: z.enum(['FREE', 'STANDARD', 'PRO']).optional(),
    // ❌ ownerId, role, email intentionally excluded
  })
  const parsed = Schema.safeParse(rawBody)
  if (!parsed.success) {
    const message =  parsed.error.issues.map((i) => i.message).join(', ')
    return NextResponse.json({ error: message }, { status: 400 })
  }
  const { businessId, ...updates } = parsed.data
  await prisma.business.update({ where: { id: businessId }, data: updates })
  return NextResponse.json({ success: true })
}