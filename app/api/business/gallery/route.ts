import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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
    const email = getEmailFromToken(request)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email } },
      include: { media: true }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    if (business.media.length >= 5) {
      return NextResponse.json({ error: 'Free plan limit: 5 photos max' }, { status: 400 })
    }

    const { image } = await request.json()

    const result = await cloudinary.uploader.upload(image, {
      folder: `meda/businesses/${business.id}`,
      transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
    })

    const media = await prisma.businessMedia.create({
      data: {
        businessId: business.id,
        url: result.secure_url,
        type: 'image',
        isPublished: true,
        order: business.media.length,
      }
    })

    return NextResponse.json({ success: true, media })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const email = getEmailFromToken(request)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email } },
      include: { media: { where: { employeeId: null }, orderBy: { order: 'asc' } } }
    })

    return NextResponse.json({ media: business?.media || [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const email = getEmailFromToken(request)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { mediaId } = await request.json()

    await prisma.businessMedia.delete({ where: { id: mediaId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}