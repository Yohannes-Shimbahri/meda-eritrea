import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ isAdmin: false })
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ isAdmin: false })
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  return NextResponse.json({ isAdmin: dbUser?.role === 'SUPER_ADMIN' })
}