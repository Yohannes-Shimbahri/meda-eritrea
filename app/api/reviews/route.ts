import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

async function getUserFromToken(token: string) {
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { email: user.email! } })
}

// POST — submit a review
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await getUserFromToken(token)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const rawBody = await req.json()

    // ── Validate input ────────────────────────────────────────
    const Schema = z.object({
      businessId: z.string().uuid('Invalid businessId'),
      rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
      comment: z.string().max(1000, 'Review must be under 1000 characters').optional(),
    })
    const parsed = Schema.safeParse(rawBody)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { businessId, rating, comment } = parsed.data

    // Check if user already reviewed this business
    const existing = await prisma.review.findFirst({
      where: { businessId, clientId: dbUser.id }
    })
    if (existing) {
      // Update existing review
      const updated = await prisma.review.update({
        where: { id: existing.id },
        data: { rating, comment },
        include: { client: { select: { fullName: true } } }
      })
      return NextResponse.json({ review: updated })
    }

    const review = await prisma.review.create({
      data: {
        businessId,
        clientId: dbUser.id,
        rating,
        comment: comment || null,
      },
      include: {
        client: { select: { fullName: true } }
      }
    })

    return NextResponse.json({ review })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}

// GET — fetch reviews for a business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('businessId')
    if (!businessId) return NextResponse.json({ reviews: [] })

    const reviews = await prisma.review.findMany({
      where: { businessId },
      include: { client: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reviews })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ reviews: [] })
  }
}