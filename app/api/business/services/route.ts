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

    const { services } = await request.json()

    const business = await prisma.business.findFirst({
      where: { owner: { email } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Delete existing services and their media
    const existingServices = await prisma.service.findMany({
      where: { businessId: business.id }
    })
    const serviceIds = existingServices.map(s => s.id)
    
    await prisma.businessMedia.deleteMany({
      where: { serviceId: { in: serviceIds } }
    })
    await prisma.service.deleteMany({ where: { businessId: business.id } })

    // Create new services with photos
    for (const s of services) {
      if (!s.name?.trim()) continue

      const service = await prisma.service.create({
        data: {
          businessId: business.id,
          name: s.name,
          price: parseFloat(s.price) || 0,
          duration: parseInt(s.duration) || 30,
          priceType: 'fixed',
          isActive: true,
        }
      })

      // Upload photo to Cloudinary and save to BusinessMedia
      if (s.photo && s.photo.startsWith('data:')) {
        try {
          const result = await cloudinary.uploader.upload(s.photo, {
            folder: `meda/services/${business.id}`,
            transformation: [{ width: 600, height: 600, crop: 'fill', quality: 'auto' }]
          })
          await prisma.businessMedia.create({
            data: {
              businessId: business.id,
              serviceId: service.id,
              url: result.secure_url,
              type: 'image',
              isPublished: true,
              order: 0,
            }
          })
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save services' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const email = getEmailFromToken(request)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email } },
      include: {
        services: {
          where: { isActive: true },
          include: { media: true }
        }
      }
    })

    return NextResponse.json({ services: business?.services || [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}
