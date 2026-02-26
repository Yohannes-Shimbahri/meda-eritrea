import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true }
    })
    if (!business) return NextResponse.json({ portfolio: [] })

    const portfolio = await prisma.businessMedia.findMany({
      where: { businessId: business.id, caption: 'portfolio' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true }
    })

    return NextResponse.json({ portfolio })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ portfolio: [] })
  }
}