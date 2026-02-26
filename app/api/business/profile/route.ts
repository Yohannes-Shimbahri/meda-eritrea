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

    const body = await request.json()
    const { name, phone, address, instagram, facebook, website, bio, coverPhoto, logo } = body

    const business = await prisma.business.findFirst({
      where: { owner: { email } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    await prisma.business.update({
      where: { id: business.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        website: website || undefined,
        description: bio || undefined,
      }
    })

    // Upload cover photo to Cloudinary
    if (coverPhoto && coverPhoto.startsWith('data:')) {
      const result = await cloudinary.uploader.upload(coverPhoto, {
        folder: `meda/covers/${business.id}`,
        transformation: [{ width: 1200, height: 300, crop: 'fill', quality: 'auto' }]
      })
      await prisma.businessMedia.deleteMany({ where: { businessId: business.id, caption: 'cover' } })
      await prisma.businessMedia.create({
        data: {
          businessId: business.id,
          url: result.secure_url,
          type: 'image',
          caption: 'cover',
          isPublished: true,
          order: -2,
        }
      })
    }

    // Upload logo to Cloudinary
    if (logo && logo.startsWith('data:')) {
      const result = await cloudinary.uploader.upload(logo, {
        folder: `meda/logos/${business.id}`,
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
      })
      await prisma.businessMedia.deleteMany({ where: { businessId: business.id, caption: 'logo' } })
      await prisma.businessMedia.create({
        data: {
          businessId: business.id,
          url: result.secure_url,
          type: 'image',
          caption: 'logo',
          isPublished: true,
          order: -1,
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const email = getEmailFromToken(request)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email } },
      include: { media: true }
    })

    return NextResponse.json({ business })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}