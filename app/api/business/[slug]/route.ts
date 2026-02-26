import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const business = await prisma.business.findFirst({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          include: { media: true }
        },
        employees: { where: { isActive: true } },
        businessHours: { orderBy: { dayOfWeek: 'asc' } },
        reviews: {
          include: { client: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        media: { where: { isPublished: true }, orderBy: { order: 'asc' } },
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ business })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 })
  }
}