export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category    = searchParams.get('category')    // parent category slug
  const subcategory = searchParams.get('subcategory') // subcategory slug
  const city        = searchParams.get('city')
  const search      = searchParams.get('search')

  try {
    const businesses = await (prisma as any).business.findMany({
      where: {
        isApproved: true,
        isActive: true,

        // ✅ Query via BusinessCategory join table so multi-category businesses show up correctly
        ...(category || subcategory ? {
          businessCategories: {
            some: {
              ...(category && {
                category: { slug: category }
              }),
              ...(subcategory && {
                subcategory: { slug: subcategory }
              }),
            }
          }
        } : {}),

        ...(city && city !== 'All Cities' && { city }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }),
      },
      include: {
        category: true,
        subcategory: true,
        // Include all category links so we can show all categories a business belongs to
        businessCategories: {
          include: {
            category: true,
            subcategory: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
        services: { take: 4, where: { isActive: true } },
        reviews: { select: { rating: true } },
        media: { where: { isPublished: true }, take: 1, orderBy: { order: 'asc' } },
      },
      orderBy: [
        { subscription: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    const formatted = businesses.map((b: any) => {
      // Primary category = first BusinessCategory link with isPrimary=true, fallback to legacy
      const primaryLink = b.businessCategories?.find((l: any) => l.isPrimary) || b.businessCategories?.[0]

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        // Primary category
        category: primaryLink?.category
          ? { id: primaryLink.category.id, name: primaryLink.category.name, slug: primaryLink.category.slug, icon: primaryLink.category.icon }
          : b.category
            ? { id: b.category.id, name: b.category.name, slug: b.category.slug, icon: b.category.icon }
            : null,
        // Primary subcategory
        subcategory: primaryLink?.subcategory
          ? { id: primaryLink.subcategory.id, name: primaryLink.subcategory.name, slug: primaryLink.subcategory.slug }
          : b.subcategory
            ? { id: b.subcategory.id, name: b.subcategory.name, slug: b.subcategory.slug }
            : null,
        // All category links — useful for showing tags on business profile
        allCategories: b.businessCategories?.map((l: any) => ({
          category: l.category ? { id: l.category.id, name: l.category.name, slug: l.category.slug, icon: l.category.icon } : null,
          subcategory: l.subcategory ? { id: l.subcategory.id, name: l.subcategory.name, slug: l.subcategory.slug } : null,
          isPrimary: l.isPrimary,
        })) || [],
        city: b.city,
        province: b.province,
        description: b.description,
        phone: b.phone,
        subscription: b.subscription,
        isVerified: b.isVerified,
        coverImage: b.media[0]?.url || null,
        rating: b.reviews.length > 0
          ? Math.round((b.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / b.reviews.length) * 10) / 10
          : null,
        reviewCount: b.reviews.length,
        serviceCount: b.services.length,
      }
    })

    return NextResponse.json({ businesses: formatted })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}