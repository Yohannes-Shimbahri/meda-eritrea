import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      businessName, categoryId, categorySelections,
      city, size, hasBooking, acceptsWalkIns, ownerName, email
    } = body

    if (!email || !businessName || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const existing = await prisma.business.findUnique({ where: { slug: baseSlug } })
    const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

    let dbUser = await prisma.user.findUnique({ where: { email } })
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: { email, fullName: ownerName || email, role: 'BUSINESS_OWNER' }
      })
    } else if (dbUser.role !== 'BUSINESS_OWNER') {
      await prisma.user.update({ where: { email }, data: { role: 'BUSINESS_OWNER' } })
    }

    const existingBusiness = await prisma.business.findFirst({ where: { ownerId: dbUser.id } })
    if (existingBusiness) {
      return NextResponse.json({ business: existingBusiness, slug: existingBusiness.slug })
    }

    const business = await prisma.business.create({
      data: {
        ownerId: dbUser.id,
        name: businessName,
        slug: finalSlug,
        categoryId: categoryId || null,
        city,
        province: 'ON',
        size: (size as 'SOLO' | 'TEAM') || 'SOLO',
        hasBooking: hasBooking ?? true,
        acceptsWalkIns: acceptsWalkIns ?? false,
        isApproved: true,
        isActive: true,
      }
    })

    if (categorySelections?.length > 0) {
      const validSelections = categorySelections.filter((s: any) => s.categoryId)
      await prisma.businessCategory.createMany({
        data: validSelections.map((s: any, i: number) => ({
          businessId: business.id,
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId || null,
          isPrimary: i === 0,
        })),
        skipDuplicates: true,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meda-eritrea.vercel.app'

    // ── Admin notification email ──────────────────────────────
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `🆕 New Business Registered — ${businessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f5f0e8; border-radius: 12px; overflow: hidden;">
          <div style="background: #c9933a; padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 22px; color: #0a0a0a;">New Business Registered</h1>
            <p style="margin: 4px 0 0; color: #0a0a0a; opacity: 0.8; font-size: 14px;">A new business just joined Meda</p>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Business</td><td style="padding: 10px 0; font-weight: 700; border-bottom: 1px solid #222;">${businessName}</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Owner</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${ownerName || '—'}</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${email}</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px; border-bottom: 1px solid #222;">City</td><td style="padding: 10px 0; border-bottom: 1px solid #222;">${city}, ON</td></tr>
              <tr><td style="padding: 10px 0; color: #888; font-size: 14px;">Profile</td><td style="padding: 10px 0;"><a href="${appUrl}/business/${finalSlug}" style="color: #c9933a;">${appUrl}/business/${finalSlug}</a></td></tr>
            </table>
            <div style="margin-top: 28px; padding: 16px; background: #1a1200; border-radius: 8px; border-left: 3px solid #c9933a;">
              <p style="margin: 0; font-size: 14px; color: #c9933a; font-weight: 600;">Action Required</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #888;">Review this business in your admin panel.</p>
              <a href="${appUrl}/admin" style="display: inline-block; margin-top: 12px; background: #c9933a; color: #0a0a0a; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px;">Open Admin Panel →</a>
            </div>
          </div>
        </div>
      `,
    }).catch(err => console.error('[admin notify] failed:', err))

    // ── Welcome email to business owner ───────────────────────
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Welcome to Meda, ${ownerName || businessName}! 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f5f0e8; border-radius: 12px; overflow: hidden;">
          <div style="background: #111; padding: 24px 32px; border-bottom: 1px solid #222;">
            <h1 style="margin: 0; font-size: 28px; color: #c9933a;">Meda</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 12px; font-size: 22px;">You're on Meda! 🎉</h2>
            <p style="color: #888; font-size: 15px; margin: 0 0 24px;">Hi ${ownerName || businessName}, your business <strong style="color: #f5f0e8;">${businessName}</strong> has been listed on Meda — the directory for Habesha businesses across Canada.</p>
            <div style="background: #111; border: 1px solid #222; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #888;">Your profile is live at:</p>
              <a href="${appUrl}/business/${finalSlug}" style="color: #c9933a; font-weight: 700; font-size: 15px; text-decoration: none;">${appUrl}/business/${finalSlug}</a>
            </div>
            <p style="color: #888; font-size: 14px; margin: 0 0 8px;">Next steps:</p>
            <ul style="color: #ccc; font-size: 14px; padding-left: 20px; line-height: 2;">
              <li>Add your services and pricing</li>
              <li>Upload photos of your work</li>
              <li>Set your business hours</li>
              <li>Add your team members</li>
            </ul>
            <a href="${appUrl}/business/dashboard" style="display: inline-block; margin-top: 20px; background: #c9933a; color: #0a0a0a; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">Set Up Your Dashboard →</a>
          </div>
        </div>
      `,
    }).catch(err => console.error('[welcome email] failed:', err))

    return NextResponse.json({ success: true, business, slug: finalSlug })
  } catch (error) {
    console.error('Business create error:', error)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}