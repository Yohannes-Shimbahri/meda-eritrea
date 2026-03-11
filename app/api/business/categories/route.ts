import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const CATEGORY_LIMITS: Record<string, number> = { FREE: 1, STANDARD: 3, PRO: Infinity }

async function getBusinessFromToken(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const email = payload.email
    if (!email) return null
    const user = await (prisma as any).user.findUnique({ where: { email } })
    if (!user) return null
    const business = await (prisma as any).business.findUnique({ where: { ownerId: user.id } })
    return business
  } catch { return null }
}

// GET — fetch current business category selections
export async function GET(req: NextRequest) {
  const business = await getBusinessFromToken(req)
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await (prisma as any).businessCategory.findMany({
    where: { businessId: business.id },
    include: {
      category: true,
      subcategory: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  })

  const selections = links.map((l: any) => ({
    linkId: l.id,
    categoryId: l.categoryId,
    subcategoryId: l.subcategoryId || '',
    isPrimary: l.isPrimary,
  }))

  return NextResponse.json({ selections })
}

// POST — save/update category selections
export async function POST(req: NextRequest) {
  const business = await getBusinessFromToken(req)
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { selections } = await req.json()
  if (!Array.isArray(selections) || selections.length === 0) {
    return NextResponse.json({ error: 'At least one category required' }, { status: 400 })
  }

  // Enforce subscription limits
  const limit = CATEGORY_LIMITS[business.subscription] ?? 1
  if (selections.length > limit) {
    return NextResponse.json({ error: `Your ${business.subscription} plan allows ${limit} ${limit === 1 ? 'category' : 'categories'}` }, { status: 403 })
  }

  // Delete all existing selections and replace
  await (prisma as any).businessCategory.deleteMany({ where: { businessId: business.id } })

  const created = await Promise.all(
    selections.map((sel: any, index: number) =>
      (prisma as any).businessCategory.create({
        data: {
          businessId: business.id,
          categoryId: sel.categoryId,
          subcategoryId: sel.subcategoryId || null,
          isPrimary: index === 0,
        },
      })
    )
  )

  // Also update the legacy categoryId on Business for backwards compat
  const primary = selections[0]
  await (prisma as any).business.update({
    where: { id: business.id },
    data: {
      categoryId: primary.categoryId || null,
      subcategoryId: primary.subcategoryId || null,
    },
  })

  return NextResponse.json({ success: true, count: created.length })
}