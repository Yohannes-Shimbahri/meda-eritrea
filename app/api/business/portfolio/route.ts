import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function getBusinessFromToken(token: string) {
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return null
  return prisma.business.findUnique({ where: { ownerId: dbUser.id } })
}

// GET — fetch portfolio photos
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ portfolio: [] })
    const business = await getBusinessFromToken(token)
    if (!business) return NextResponse.json({ portfolio: [] })

    const portfolio = await prisma.businessMedia.findMany({
      where: { businessId: business.id, caption: 'portfolio' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true },
    })
    return NextResponse.json({ portfolio })
  } catch (err) {
    console.error('[portfolio GET]', err)
    return NextResponse.json({ portfolio: [] })
  }
}

// POST — upload portfolio photo
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business = await getBusinessFromToken(token)
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Check plan limits
    const existing = await prisma.businessMedia.count({
      where: { businessId: business.id, caption: 'portfolio' },
    })
    const limits: Record<string, number> = { FREE: 5, STANDARD: 20, PRO: Infinity }
    const limit = limits[business.subscription] ?? 5
    if (existing >= limit) {
      return NextResponse.json({
        error: `${business.subscription} plan allows max ${limit} portfolio photos. Upgrade to add more.`,
        limitReached: true,
      }, { status: 403 })
    }

    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: `meda/portfolio/${business.id}`,
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    })

    const media = await prisma.businessMedia.create({
      data: {
        businessId: business.id,
        url: uploadRes.secure_url,
        type: 'IMAGE',
        caption: 'portfolio',
      },
    })

    return NextResponse.json({ success: true, media: { id: media.id, url: media.url } })
  } catch (err) {
    console.error('[portfolio POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE — remove portfolio photo
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business = await getBusinessFromToken(token)
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { mediaId } = await req.json()
    const media = await prisma.businessMedia.findFirst({
      where: { id: mediaId, businessId: business.id, caption: 'portfolio' },
    })
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Try to delete from Cloudinary (extract public_id from URL)
    try {
      const urlParts = media.url.split('/')
      const filename = urlParts[urlParts.length - 1].split('.')[0]
      const folder = urlParts.slice(urlParts.indexOf('meda')).slice(0, -1).join('/')
      await cloudinary.uploader.destroy(`${folder}/${filename}`)
    } catch { /* cloudinary cleanup is best-effort */ }

    await prisma.businessMedia.delete({ where: { id: mediaId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portfolio DELETE]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}