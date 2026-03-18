import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// Simple JWT decode without verification (token already verified by Supabase)
function decodeToken(token: string): { sub?: string } | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const business = await prisma.business.findFirst({ where: { slug } })
    if (!business) return NextResponse.json({ ok: false })

    // Optionally capture viewer identity (if logged in)
    let viewerId: string | null = null
    try {
      const auth = req.headers.get('authorization')
      if (auth?.startsWith('Bearer ')) {
        const decoded = decodeToken(auth.slice(7))
        if (decoded?.sub && decoded.sub !== business.ownerId) {
          viewerId = decoded.sub
        }
      }
    } catch { /* anonymous view */ }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Deduplicate: one view per viewer/IP per hour
    const recent = await (prisma as any).profileView.findFirst({
      where: {
        businessId: business.id,
        ...(viewerId ? { viewerId } : { viewerIp: ip }),
        viewedAt: { gte: oneHourAgo },
      },
    })

    if (!recent) {
      await (prisma as any).profileView.create({
        data: {
          businessId: business.id,
          viewerId: viewerId || null,
          viewerIp: ip,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('View tracker error:', err)
    return NextResponse.json({ ok: false })
  }
}