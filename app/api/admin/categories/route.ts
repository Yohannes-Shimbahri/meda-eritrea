import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

async function uploadImage(base64: string, slug: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64, {
    folder: `meda/categories`,
    public_id: slug,
    overwrite: true,
    transformation: [{ width: 600, height: 400, crop: 'fill', quality: 'auto:low', format: 'webp' }],
  })
  return result.secure_url
}

// GET — public
export async function GET() {
  try {
    const categories = await (prisma as any).category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { businesses: true } },
        subcategories: {
          where: { isActive: true },
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { businesses: true } } },
        },
      },
    })
    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store',
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST — admin only
export async function POST(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await (prisma as any).user.findUnique({ where: { email } })
    if (admin?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, icon, description, order, imageBase64, parentId } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const slug = slugify(name)
    let imageUrl: string | undefined

    if (imageBase64?.startsWith('data:')) {
      imageUrl = await uploadImage(imageBase64, slug)
    }

    const category = await (prisma as any).category.create({
      data: {
        name, slug,
        icon: icon || '🏢',
        description: description || null,
        order: order ?? 0,
        imageUrl: imageUrl ?? null,
        parentId: parentId || null,
      },
    })
    return NextResponse.json({ success: true, category })
  } catch (err: any) {
    if (err?.code === 'P2002') return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PATCH — admin only
export async function PATCH(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await (prisma as any).user.findUnique({ where: { email } })
    if (admin?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, name, icon, description, order, isActive, imageBase64, parentId } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const data: any = {}
    if (name !== undefined) { data.name = name; data.slug = slugify(name) }
    if (icon !== undefined) data.icon = icon
    if (description !== undefined) data.description = description
    if (order !== undefined) data.order = order
    if (isActive !== undefined) data.isActive = isActive
    if (parentId !== undefined) data.parentId = parentId || null

    if (imageBase64?.startsWith('data:')) {
      const slug = data.slug || (await (prisma as any).category.findUnique({ where: { id } }))?.slug || id
      data.imageUrl = await uploadImage(imageBase64, slug)
    }

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

    const bizCount = await (prisma as any).business.count({ where: { categoryId: id } })
    const subBizCount = await (prisma as any).business.count({ where: { subcategoryId: id } })
    if (bizCount + subBizCount > 0) return NextResponse.json({ error: `Cannot delete — ${bizCount + subBizCount} business(es) use this category` }, { status: 400 })

    await (prisma as any).category.deleteMany({ where: { parentId: id } })
    await (prisma as any).category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}