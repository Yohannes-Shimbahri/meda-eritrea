import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

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
  const users = await prisma.user.findMany({
    include: { business: { select: { slug: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ users })
}