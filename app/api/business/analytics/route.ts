import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

function getEmailFromToken(request: Request): string | null {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  try {
    const email = getEmailFromToken(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = prisma as any

    const business = await db.business.findFirst({
      where: { owner: { email } },
      include: {
        services: true,
        bookings: {
          include: { service: true },
          orderBy: { createdAt: 'asc' },
        },
        profileViews: true,
      },
    })

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'

    const now = new Date()
    const daysBack = range === '7d' ? 7 : range === '90d' ? 90 : 30
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysBack)

    const bookings: any[] = business.bookings ?? []
    const recentBookings = bookings.filter((b: any) => new Date(b.createdAt) >= startDate)

    const trendMap: Record<string, { bookings: number; revenue: number }> = {}
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      trendMap[key] = { bookings: 0, revenue: 0 }
    }
    for (const b of recentBookings) {
      const key = new Date(b.createdAt).toISOString().split('T')[0]
      if (trendMap[key]) {
        trendMap[key].bookings += 1
        trendMap[key].revenue += Number(b.service?.price ?? 0)
      }
    }
    const trend = Object.entries(trendMap).map(([date, val]) => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      bookings: val.bookings,
      revenue: val.revenue,
    }))

    const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {}
    for (const b of bookings) {
      if (!b.service) continue
      const key = b.service.id
      if (!serviceMap[key]) serviceMap[key] = { name: b.service.name, count: 0, revenue: 0 }
      serviceMap[key].count += 1
      serviceMap[key].revenue += Number(b.service.price ?? 0)
    }
    const topServices = Object.values(serviceMap).sort((a, b) => b.count - a.count).slice(0, 5)

    const totalRevenue = bookings
      .filter((b: any) => b.status === 'COMPLETED')
      .reduce((sum: number, b: any) => sum + Number(b.service?.price ?? 0), 0)
    const periodRevenue = recentBookings
      .filter((b: any) => b.status === 'COMPLETED')
      .reduce((sum: number, b: any) => sum + Number(b.service?.price ?? 0), 0)
    const revenueByService = Object.values(serviceMap)
      .map(s => ({ name: s.name, revenue: s.revenue, bookings: s.count }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    const profileViews: any[] = business.profileViews ?? []
    const recentViews = profileViews.filter((v: any) => new Date(v.viewedAt) >= startDate)

    const viewTrendMap: Record<string, number> = {}
    for (const key of Object.keys(trendMap)) viewTrendMap[key] = 0
    for (const v of recentViews) {
      const key = new Date(v.viewedAt).toISOString().split('T')[0]
      if (viewTrendMap[key] !== undefined) viewTrendMap[key] += 1
    }
    const viewTrend = Object.entries(viewTrendMap).map(([date, views]) => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      views,
    }))

    const totalViews = profileViews.length
    const periodViews = recentViews.length
    const conversionRate = periodViews > 0 ? Math.round((recentBookings.length / periodViews) * 100) : 0
    const completed = bookings.filter((b: any) => b.status === 'COMPLETED').length
    const cancelled = bookings.filter((b: any) => b.status === 'CANCELLED').length
    const completionRate = bookings.length > 0 ? Math.round((completed / bookings.length) * 100) : 0

    return NextResponse.json({
      summary: { totalBookings: bookings.length, periodBookings: recentBookings.length, totalRevenue, periodRevenue, completionRate, cancelled, totalViews, periodViews, conversionRate },
      trend, viewTrend, topServices, revenueByService,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}