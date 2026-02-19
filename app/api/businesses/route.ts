import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const city = searchParams.get('city')
  const search = searchParams.get('search')

  try {
    const businesses = await prisma.business.findMany({
      where: {
        isApproved: true,
        isActive: true,
        ...(category && { category: category.toUpperCase().replace('-', '_') as never }),
        ...(city && city !== 'All Cities' && { city }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }),
      },
      include: {
        services: { take: 4, where: { isActive: true } },
        reviews: { select: { rating: true } },
        media: { where: { isPublished: true }, take: 1, orderBy: { order: 'asc' } },
      },
      orderBy: [
        { subscription: 'asc' }, // PRO first, then STANDARD, then FREE
        { createdAt: 'desc' },
      ],
    })

    const formatted = businesses.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      city: b.city,
      province: b.province,
      description: b.description,
      phone: b.phone,
      subscription: b.subscription,
      isVerified: b.isVerified,
      coverImage: b.media[0]?.url || null,
      rating: b.reviews.length > 0
        ? Math.round((b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length) * 10) / 10
        : null,
      reviewCount: b.reviews.length,
      serviceCount: b.services.length,
    }))

    return NextResponse.json({ businesses: formatted })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}