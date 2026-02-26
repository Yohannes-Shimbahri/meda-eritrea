import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({
      where: { ownerId: (await prisma.user.findUnique({ where: { email: user.email! } }))?.id }
    })
    if (!business) return NextResponse.json({ bookings: [] })

    const bookings = await prisma.booking.findMany({
      where: { businessId: business.id },
      include: {
        client: { select: { fullName: true, email: true, phone: true } },
        service: { select: { name: true, price: true, duration: true } },
        employee: { select: { name: true } },
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ bookings })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, status } = await req.json()

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        client: { select: { fullName: true, email: true } },
        business: { select: { name: true, slug: true } },
        service: { select: { name: true, price: true } },
      }
    })

    // Send email when confirmed or cancelled
    if (status === 'CONFIRMED' && booking.client.email) {
      const bookingDate = new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      await resend.emails.send({
        from: FROM,
        to: booking.client.email,
        subject: `Booking Confirmed — ${booking.business.name} ✅`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f5f0e8; border-radius: 12px; overflow: hidden;">
            <div style="background: #0a1f0a; padding: 24px 32px; border-bottom: 2px solid #4ade80;">
              <h1 style="margin: 0; font-size: 22px; color: #4ade80;">Booking Confirmed! ✅</h1>
              <p style="margin: 4px 0 0; color: #888; font-size: 14px;">Your appointment is locked in</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #ccc; font-size: 15px; margin: 0 0 24px;">Hi ${booking.client.fullName}, your booking at <strong style="color: #c9933a;">${booking.business.name}</strong> has been confirmed.</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Business</td><td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #222;">${booking.business.name}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Service</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${booking.service?.name || 'N/A'}${booking.service?.price ? ` — $${booking.service.price}` : ''}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Date</td><td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #222;">${bookingDate}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px;">Time</td><td style="padding: 10px 0; font-weight: 600; color: #c9933a;">${booking.startTime}</td></tr>
              </table>
              <div style="margin-top: 28px; padding: 16px; background: #0a1f0a; border-radius: 8px; border-left: 3px solid #4ade80;">
                <p style="margin: 0; font-size: 13px; color: #4ade80; font-weight: 600;">See you there!</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #888;">If you need to cancel or reschedule, please contact the business directly.</p>
              </div>
            </div>
          </div>
        `,
      }).catch(err => console.error('[resend confirmed email]', err))
    }

    if (status === 'CANCELLED' && booking.client.email) {
      await resend.emails.send({
        from: FROM,
        to: booking.client.email,
        subject: `Booking Cancelled — ${booking.business.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f5f0e8; border-radius: 12px; overflow: hidden;">
            <div style="background: #1f0a0a; padding: 24px 32px; border-bottom: 2px solid #e05c5c;">
              <h1 style="margin: 0; font-size: 22px; color: #e05c5c;">Booking Cancelled</h1>
              <p style="margin: 4px 0 0; color: #888; font-size: 14px;">Your appointment has been cancelled</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #ccc; font-size: 15px; margin: 0 0 24px;">Hi ${booking.client.fullName}, unfortunately your booking at <strong style="color: #f5f0e8;">${booking.business.name}</strong> has been cancelled.</p>
              <p style="color: #888; font-size: 14px;">You can browse other businesses on Meda and book a new appointment.</p>
            </div>
          </div>
        `,
      }).catch(err => console.error('[resend cancelled email]', err))
    }

    return NextResponse.json({ booking })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}