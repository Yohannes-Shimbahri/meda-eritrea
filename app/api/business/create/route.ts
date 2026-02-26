import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function getEmailFromToken(request: Request): string | null {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch { return null }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessName, category, city, size, hasBooking, acceptsWalkIns, ownerName, email } = body

    // Create slug from business name
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const existing = await prisma.business.findUnique({ where: { slug: baseSlug } })
    const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

    // Find or create user in our DB
    let dbUser = await prisma.user.findUnique({ where: { email } })
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email,
          fullName: ownerName,
          role: 'BUSINESS_OWNER',
        }
      })
    }

    // Check if business already exists for this user
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: dbUser.id }
    })
    if (existingBusiness) {
      return NextResponse.json({ business: existingBusiness, slug: existingBusiness.slug })
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        ownerId: dbUser.id,
        name: businessName,
        slug: finalSlug,
        category: category.toUpperCase().replace(/-/g, '_') as never,
        city,
        province: 'ON',
        size: size as never,
        hasBooking,
        acceptsWalkIns,
        isApproved: true,
        isActive: true,
      }
    })

    return NextResponse.json({ business, slug: finalSlug })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}