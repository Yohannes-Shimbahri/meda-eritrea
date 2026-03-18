import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getEmailFromToken(req: NextRequest): string | null {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch { return null }
}

// GET — return client profile
export async function GET(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        preferredLanguage: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            savedBusinesses: true,
          }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH — update client profile
export async function PATCH(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { fullName, phone, preferredLanguage } = await req.json()

    const user = await prisma.user.update({
      where: { email },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(preferredLanguage && { preferredLanguage }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        preferredLanguage: true,
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}