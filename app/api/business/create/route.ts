import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { businessName, category, city, size, hasBooking, acceptsWalkIns, ownerName, email } = body

    // Create slug from business name
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Make slug unique if needed
    const existing = await prisma.business.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    // Create or find user in our DB
    let dbUser = await prisma.user.findUnique({ where: { email } })
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email,
          fullName: ownerName,
          role: 'BUSINESS_OWNER',
        }
      })
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        ownerId: dbUser.id,
        name: businessName,
        slug: finalSlug,
        category: category.toUpperCase().replace(/-/g, '_') as never,
        city,
        province: 'ON', // default, can be updated later
        size: size as never,
        hasBooking,
        acceptsWalkIns,
        isApproved: true, // auto-approve for now
        isActive: true,
      }
    })

    return NextResponse.json({ business, slug: finalSlug })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}