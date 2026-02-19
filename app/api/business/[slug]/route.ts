import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: {
        services: { where: { isActive: true } },
        employees: {
          where: { isActive: true },
          include: { schedules: true, media: { take: 1 } },
        },
        businessHours: true,
        reviews: {
          include: { client: { select: { fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        media: { where: { isPublished: true }, orderBy: { order: 'asc' } },
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const avgRating = business.reviews.length > 0
      ? Math.round((business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length) * 10) / 10
      : null

    return NextResponse.json({ business: { ...business, avgRating } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 })
  }
}