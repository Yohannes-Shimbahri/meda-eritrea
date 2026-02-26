import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

function getEmailFromToken(req: Request): string | null {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch { return null }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// GET — public, returns all active categories
export async function GET() {
  try {
    const categories = await (prisma as any).category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { businesses: true } } },
    })
    return NextResponse.json({ categories })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST — admin only, create category
export async function POST(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).user.findUnique({ where: { email } })
    if (admin?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, icon, description, order } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const slug = slugify(name)

    const category = await (prisma as any).category.create({
      data: { name, slug, icon: icon || '🏢', description: description || null, order: order ?? 0 },
    })
    return NextResponse.json({ success: true, category })
  } catch (err: any) {
    if (err?.code === 'P2002') return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PATCH — admin only, update category
export async function PATCH(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).user.findUnique({ where: { email } })
    if (admin?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, name, icon, description, order, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const data: any = {}
    if (name !== undefined) { data.name = name; data.slug = slugify(name) }
    if (icon !== undefined) data.icon = icon
    if (description !== undefined) data.description = description
    if (order !== undefined) data.order = order
    if (isActive !== undefined) data.isActive = isActive

    const category = await (prisma as any).category.update({ where: { id }, data })
    return NextResponse.json({ success: true, category })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE — admin only
export async function DELETE(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).user.findUnique({ where: { email } })
    if (admin?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Check if any businesses use this category
    const count = await (prisma as any).business.count({ where: { categoryId: id } })
    if (count > 0) return NextResponse.json({ error: `Cannot delete — ${count} business(es) use this category` }, { status: 400 })

    await (prisma as any).category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}