import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, fullName } = body

    // ✅ Validate before hitting the database
    if (!email || !fullName) {
      return NextResponse.json({ error: 'email and fullName are required' }, { status: 400 })
    }

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, role: 'CLIENT' }
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}