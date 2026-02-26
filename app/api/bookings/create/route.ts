import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, serviceId, employeeId, date, startTime, notes } = await req.json()

    // Upsert client
    const client = await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: {
        email: user.email!,
        fullName: user.user_metadata?.full_name || user.email!.split('@')[0],
        role: 'CLIENT',
      }
    })

    const booking = await prisma.booking.create({
      data: {
        businessId,
        clientId: client.id,
        serviceId: serviceId || null,
        employeeId: employeeId || null,
        date: new Date(date),
        startTime,
        notes: notes || null,
        status: 'PENDING',
      }
    })

    // Fetch full details for email
    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        business: { select: { name: true, email: true, owner: { select: { email: true } } } },
        service: { select: { name: true, price: true } },
        employee: { select: { name: true } },
      }
    })

    // Send email to business owner
    const businessEmail = fullBooking?.business?.owner?.email || fullBooking?.business?.email
    if (businessEmail) {
      const bookingDate = new Date(date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      await resend.emails.send({
        from: FROM,
        to: businessEmail,
        subject: `New Booking Request — ${client.fullName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f5f0e8; border-radius: 12px; overflow: hidden;">
            <div style="background: #c9933a; padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 22px; color: #0a0a0a;">New Booking Request</h1>
              <p style="margin: 4px 0 0; color: #0a0a0a; opacity: 0.8; font-size: 14px;">Someone wants to book with ${fullBooking?.business?.name}</p>
            </div>
            <div style="padding: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Client</td><td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #222;">${client.fullName}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${client.email}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Service</td><td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #222;">${fullBooking?.service?.name || 'Not specified'}${fullBooking?.service?.price ? ` — $${fullBooking.service.price}` : ''}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Date</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${bookingDate}</td></tr>
                <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Time</td><td style="padding: 10px 0; font-weight: 600; color: #c9933a; border-bottom: 1px solid #222;">${startTime}</td></tr>
                ${fullBooking?.employee ? `<tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Staff</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${fullBooking.employee.name}</td></tr>` : ''}
                ${notes ? `<tr><td style="padding: 10px 0; color: #888; font-size: 14px;">Note</td><td style="padding: 10px 0; font-style: italic; color: #ccc;">${notes}</td></tr>` : ''}
              </table>
              <div style="margin-top: 28px; padding: 16px; background: #1a1200; border-radius: 8px; border-left: 3px solid #c9933a;">
                <p style="margin: 0; font-size: 14px; color: #c9933a; font-weight: 600;">Action Required</p>
                <p style="margin: 6px 0 0; font-size: 13px; color: #888;">Log in to your Meda dashboard to confirm or decline this booking.</p>
              </div>
            </div>
          </div>
        `,
      }).catch(err => console.error('[resend business email]', err))
    }

    // Send confirmation email to client
    await resend.emails.send({
      from: FROM,
      to: client.email,
      subject: `Booking Requested — ${fullBooking?.business?.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f5f0e8; border-radius: 12px; overflow: hidden;">
          <div style="background: #111; padding: 24px 32px; border-bottom: 1px solid #222;">
            <h1 style="margin: 0; font-size: 22px; color: #c9933a;">Meda</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 8px; font-size: 20px;">Booking Requested! 🎉</h2>
            <p style="color: #888; font-size: 14px; margin: 0 0 24px;">Your booking request has been sent to <strong style="color: #f5f0e8;">${fullBooking?.business?.name}</strong>. They will confirm shortly.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Business</td><td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #222;">${fullBooking?.business?.name}</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Service</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${fullBooking?.service?.name || 'Not specified'}</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Date</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${new Date(date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px;">Time</td><td style="padding: 10px 0; font-weight: 600; color: #c9933a;">${startTime}</td></tr>
            </table>
            <p style="margin-top: 24px; font-size: 13px; color: #555;">You'll receive another email once the business confirms your booking.</p>
          </div>
        </div>
      `,
    }).catch(err => console.error('[resend client email]', err))

    return NextResponse.json({ booking })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}