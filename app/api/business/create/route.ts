import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      businessName, categoryId, categorySelections,
      city, size, hasBooking, acceptsWalkIns, ownerName, email
    } = body

    if (!email || !businessName || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create slug from business name
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const existing = await prisma.business.findUnique({ where: { slug: baseSlug } })
    const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

    // Find or create user in DB
    let dbUser = await prisma.user.findUnique({ where: { email } })
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: { email, fullName: ownerName || email, role: 'BUSINESS_OWNER' }
      })
    } else if (dbUser.role !== 'BUSINESS_OWNER') {
      await prisma.user.update({
        where: { email },
        data: { role: 'BUSINESS_OWNER' }
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
        categoryId: categoryId || null,
        city,
        province: 'ON',
        size: (size as 'SOLO' | 'TEAM') || 'SOLO',
        hasBooking: hasBooking ?? true,
        acceptsWalkIns: acceptsWalkIns ?? false,
        isApproved: true,
        isActive: true,
      }
    })

    // Save all category selections to BusinessCategory join table
    if (categorySelections?.length > 0) {
      const validSelections = categorySelections.filter((s: any) => s.categoryId)
      await prisma.businessCategory.createMany({
        data: validSelections.map((s: any, i: number) => ({
          businessId: business.id,
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId || null,
          isPrimary: i === 0,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ success: true, business, slug: finalSlug })
  } catch (error) {
    console.error('Business create error:', error)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}