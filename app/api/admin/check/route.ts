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
  if (!token) return NextResponse.json({ isAdmin: false })
  const user = await getAdminUser(token)
  return NextResponse.json({ isAdmin: !!user })
}